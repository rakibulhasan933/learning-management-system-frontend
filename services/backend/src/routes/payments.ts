import { randomBytes } from "node:crypto"
import {
  and,
  asc,
  courses,
  desc,
  enrollments,
  eq,
  orders,
  profiles,
  sql,
  users,
  alias,
} from "@workspace/db"
import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type {
  AdminPendingPaymentsResponse,
  ManualPaymentInstructionsDto,
  PaymentInstructionsResponse,
  PaymentMethod,
  PaymentOrderDto,
  StudentOrderListResponse,
} from "@workspace/types"
import { paymentMethods } from "@workspace/types"

import { env } from "../config/env.js"
import { asyncHandler, HttpError } from "../http/errors.js"
import { db } from "../lib/database.js"
import {
  sendPaymentApprovedEmail,
  sendPaymentRejectedEmail,
} from "../lib/mailer.js"
import { uploadPaymentProofScreenshot } from "../lib/supabase-storage.js"
import { requireAuth, requireRole } from "../middleware/auth.js"

export const paymentsRouter: ExpressRouter = Router()
const studentProfiles = alias(profiles, "student_profiles")
const studentUsers = alias(users, "student_users")
const reviewerProfiles = alias(profiles, "reviewer_profiles")
const reviewerUsers = alias(users, "reviewer_users")

const createInstructionsSchema = z.object({
  couponCode: z.string().trim().min(1).max(64).optional(),
  courseId: z.string().uuid(),
})
const orderParamsSchema = z.object({
  orderId: z.string().uuid(),
})
const proofScreenshotSchema = z.object({
  base64: z.string().min(1),
  contentType: z.string().min(1).max(120),
  fileName: z.string().min(1).max(255),
})
const proofSubmissionSchema = z.object({
  paymentMethod: z.enum(paymentMethods),
  proofScreenshot: proofScreenshotSchema.optional(),
  senderNumber: z.string().trim().min(4).max(64),
  transactionId: z.string().trim().min(3).max(255),
})
const pendingPaymentsQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
  q: z.string().trim().min(1).optional(),
  sort: z.enum(["created_asc", "created_desc"]).default("created_desc"),
})
const rejectionSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
})

type OrderRow = {
  amount: string
  couponCode: string | null
  courseId: string
  courseSlug: string
  courseTitle: string
  createdAt: Date
  currency: string
  discountAmount: string
  id: string
  paymentMethod: PaymentMethod | null
  proofScreenshotUrl: string | null
  referenceCode: string
  rejectionReason: string | null
  reviewedAt: Date | null
  reviewedByEmail: string | null
  senderNumber: string | null
  status: PaymentOrderDto["status"]
  studentEmail: string
  studentName: string | null
  studentProfileId: string
  transactionId: string | null
  updatedAt: Date
}

function serializeDate(value: Date | null) {
  return value ? value.toISOString() : null
}

function toMoney(value: number) {
  return Math.max(0, value).toFixed(2)
}

function toOrderDto(row: OrderRow): PaymentOrderDto {
  const amount = Number(row.amount)
  const discountAmount = Number(row.discountAmount)

  return {
    amount: row.amount,
    couponCode: row.couponCode,
    courseId: row.courseId,
    courseSlug: row.courseSlug,
    courseTitle: row.courseTitle,
    createdAt: row.createdAt.toISOString(),
    currency: row.currency,
    discountAmount: row.discountAmount,
    id: row.id,
    originalAmount: toMoney(amount + discountAmount),
    paymentMethod: row.paymentMethod,
    proofScreenshotUrl: row.proofScreenshotUrl,
    referenceCode: row.referenceCode,
    rejectionReason: row.rejectionReason,
    reviewedAt: serializeDate(row.reviewedAt),
    reviewedByEmail: row.reviewedByEmail,
    senderNumber: row.senderNumber,
    status: row.status,
    studentEmail: row.studentEmail,
    studentName: row.studentName,
    transactionId: row.transactionId,
    updatedAt: row.updatedAt.toISOString(),
  }
}

function getInstructions(): ManualPaymentInstructionsDto {
  return {
    bankDetails: env.MANUAL_PAYMENT_BANK_DETAILS ?? null,
    bkashNumber: env.MANUAL_PAYMENT_BKASH_NUMBER ?? null,
    nagadNumber: env.MANUAL_PAYMENT_NAGAD_NUMBER ?? null,
    rocketNumber: env.MANUAL_PAYMENT_ROCKET_NUMBER ?? null,
  }
}

function parseCoupons() {
  const coupons: Record<string, { type: "amount" | "percent"; value: number }> = {}

  for (const entry of (env.MANUAL_PAYMENT_COUPONS ?? "").split(",")) {
    const [rawCode, rawType, rawValue] = entry.split(":")
    const code = rawCode?.trim().toUpperCase()
    const type = rawType?.trim()
    const value = Number(rawValue)

    if (
      code &&
      (type === "percent" || type === "amount") &&
      Number.isFinite(value) &&
      value > 0
    ) {
      coupons[code] = { type, value }
    }
  }

  return coupons
}

function applyCoupon(price: number, couponCode: string | undefined) {
  if (!couponCode) {
    return { amount: toMoney(price), couponCode: null, discountAmount: "0.00" }
  }

  const normalizedCode = couponCode.toUpperCase()
  const coupon = parseCoupons()[normalizedCode]

  if (!coupon) {
    throw new HttpError(400, "Coupon code is invalid.")
  }

  const discount =
    coupon.type === "percent" ? price * (coupon.value / 100) : coupon.value
  const discountAmount = Math.min(price, discount)

  return {
    amount: toMoney(price - discountAmount),
    couponCode: normalizedCode,
    discountAmount: toMoney(discountAmount),
  }
}

function createReferenceCode() {
  return `ORD-${randomBytes(4).toString("hex").toUpperCase()}`
}

async function getOrderForViewer(orderId: string) {
  const [order] = await db
    .select({
      amount: orders.amount,
      couponCode: orders.couponCode,
      courseId: orders.courseId,
      courseSlug: courses.slug,
      courseTitle: courses.title,
      createdAt: orders.createdAt,
      currency: orders.currency,
      discountAmount: orders.discountAmount,
      id: orders.id,
      paymentMethod: orders.paymentMethod,
      proofScreenshotUrl: orders.proofScreenshotUrl,
      referenceCode: orders.referenceCode,
      rejectionReason: orders.rejectionReason,
      reviewedAt: orders.reviewedAt,
      reviewedByEmail: reviewerUsers.email,
      senderNumber: orders.senderNumber,
      status: orders.status,
      studentEmail: studentUsers.email,
      studentName: studentProfiles.fullName,
      studentProfileId: studentProfiles.id,
      transactionId: orders.transactionId,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .innerJoin(courses, eq(orders.courseId, courses.id))
    .innerJoin(studentProfiles, eq(orders.userId, studentProfiles.id))
    .innerJoin(studentUsers, eq(studentProfiles.userId, studentUsers.id))
    .leftJoin(reviewerProfiles, eq(orders.reviewedBy, reviewerProfiles.id))
    .leftJoin(reviewerUsers, eq(reviewerProfiles.userId, reviewerUsers.id))
    .where(eq(orders.id, orderId))
    .limit(1)

  return order as OrderRow | undefined
}

async function notifyPaymentApproved(order: PaymentOrderDto) {
  try {
    await sendPaymentApprovedEmail({
      courseTitle: order.courseTitle,
      dashboardUrl: new URL("/dashboard/student", env.CORS_ORIGIN).toString(),
      email: order.studentEmail,
    })
  } catch (error) {
    console.error("Payment approval email failed.", error)
  }
}

async function notifyPaymentRejected(order: PaymentOrderDto, reason: string) {
  try {
    await sendPaymentRejectedEmail({
      courseTitle: order.courseTitle,
      dashboardUrl: new URL("/dashboard/student", env.CORS_ORIGIN).toString(),
      email: order.studentEmail,
      reason,
    })
  } catch (error) {
    console.error("Payment rejection email failed.", error)
  }
}

paymentsRouter.post(
  "/instructions",
  requireAuth,
  requireRole(["admin", "student"]),
  asyncHandler(async (request, response) => {
    const input = createInstructionsSchema.parse(request.body)
    const [course] = await db
      .select({
        currency: courses.currency,
        id: courses.id,
        price: courses.price,
        status: courses.status,
        title: courses.title,
      })
      .from(courses)
      .where(eq(courses.id, input.courseId))
      .limit(1)

    if (!course || course.status !== "published") {
      throw new HttpError(404, "Course not found.")
    }

    const [existingEnrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, course.id),
          eq(enrollments.userId, request.auth!.profile.id),
          eq(enrollments.status, "active"),
        ),
      )
      .limit(1)

    if (existingEnrollment) {
      throw new HttpError(409, "You are already enrolled in this course.")
    }

    const [existingOrder] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.courseId, course.id),
          eq(orders.userId, request.auth!.profile.id),
          sql`${orders.status} in ('pending_verification', 'rejected')`,
        ),
      )
      .orderBy(desc(orders.createdAt))
      .limit(1)

    if (existingOrder) {
      const order = await getOrderForViewer(existingOrder.id)

      response.status(200).json({
        instructions: getInstructions(),
        order: toOrderDto(order!),
      } satisfies PaymentInstructionsResponse)
      return
    }

    const price = Number(course.price)
    const pricing = applyCoupon(price, input.couponCode)
    const isFree = Number(pricing.amount) === 0

    const createdOrder = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          amount: pricing.amount,
          couponCode: pricing.couponCode,
          courseId: course.id,
          currency: course.currency,
          discountAmount: pricing.discountAmount,
          referenceCode: createReferenceCode(),
          status: isFree ? "paid" : "pending_verification",
          userId: request.auth!.profile.id,
        })
        .returning({ id: orders.id })

      if (!order) {
        throw new HttpError(500, "Order could not be created.")
      }

      if (isFree) {
        await tx.insert(enrollments).values({
          courseId: course.id,
          orderId: order.id,
          userId: request.auth!.profile.id,
        })
      }

      return order
    })
    const order = await getOrderForViewer(createdOrder.id)

    response.status(201).json({
      instructions: getInstructions(),
      order: toOrderDto(order!),
    } satisfies PaymentInstructionsResponse)
  }),
)

paymentsRouter.get(
  "/orders/:orderId/instructions",
  requireAuth,
  asyncHandler(async (request, response) => {
    const { orderId } = orderParamsSchema.parse(request.params)
    const order = await getOrderForViewer(orderId)

    if (!order) {
      throw new HttpError(404, "Order not found.")
    }

    if (
      request.auth!.profile.role !== "admin" &&
      order.studentProfileId !== request.auth!.profile.id
    ) {
      throw new HttpError(403, "Access denied.")
    }

    response.status(200).json({
      instructions: getInstructions(),
      order: toOrderDto(order),
    } satisfies PaymentInstructionsResponse)
  }),
)

paymentsRouter.post(
  "/orders/:orderId/proof",
  requireAuth,
  requireRole(["admin", "student"]),
  asyncHandler(async (request, response) => {
    const { orderId } = orderParamsSchema.parse(request.params)
    const input = proofSubmissionSchema.parse(request.body)
    const order = await getOrderForViewer(orderId)

    if (!order) {
      throw new HttpError(404, "Order not found.")
    }

    if (
      request.auth!.profile.role !== "admin" &&
      order.studentProfileId !== request.auth!.profile.id
    ) {
      throw new HttpError(403, "Access denied.")
    }

    if (order.status === "paid") {
      throw new HttpError(409, "This order is already paid.")
    }

    const proofScreenshotUrl = input.proofScreenshot
      ? await uploadPaymentProofScreenshot({
          ...input.proofScreenshot,
          orderId,
        })
      : order.proofScreenshotUrl

    await db
      .update(orders)
      .set({
        paymentMethod: input.paymentMethod,
        proofScreenshotUrl,
        rejectionReason: null,
        reviewedAt: null,
        reviewedBy: null,
        senderNumber: input.senderNumber,
        status: "pending_verification",
        transactionId: input.transactionId,
      })
      .where(eq(orders.id, orderId))

    const updatedOrder = await getOrderForViewer(orderId)

    response.status(200).json(toOrderDto(updatedOrder!))
  }),
)

paymentsRouter.get(
  "/my-orders",
  requireAuth,
  requireRole(["admin", "student"]),
  asyncHandler(async (request, response) => {
    const rows = await db
      .select({
        amount: orders.amount,
        couponCode: orders.couponCode,
        courseId: orders.courseId,
        courseSlug: courses.slug,
        courseTitle: courses.title,
        createdAt: orders.createdAt,
        currency: orders.currency,
        discountAmount: orders.discountAmount,
        id: orders.id,
        paymentMethod: orders.paymentMethod,
        proofScreenshotUrl: orders.proofScreenshotUrl,
        referenceCode: orders.referenceCode,
        rejectionReason: orders.rejectionReason,
        reviewedAt: orders.reviewedAt,
        reviewedByEmail: sql<string>`null`,
        senderNumber: orders.senderNumber,
        status: orders.status,
        studentEmail: users.email,
        studentName: profiles.fullName,
        studentProfileId: profiles.id,
        transactionId: orders.transactionId,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .innerJoin(courses, eq(orders.courseId, courses.id))
      .innerJoin(profiles, eq(orders.userId, profiles.id))
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(orders.userId, request.auth!.profile.id))
      .orderBy(desc(orders.createdAt))

    response.status(200).json({
      orders: (rows as OrderRow[]).map(toOrderDto),
    } satisfies StudentOrderListResponse)
  }),
)

paymentsRouter.get(
  "/admin/pending",
  requireAuth,
  requireRole(["admin"]),
  asyncHandler(async (request, response) => {
    const query = pendingPaymentsQuerySchema.parse(request.query)
    const filters = [eq(orders.status, "pending_verification")]

    if (query.courseId) {
      filters.push(eq(orders.courseId, query.courseId))
    }

    if (query.paymentMethod) {
      filters.push(eq(orders.paymentMethod, query.paymentMethod))
    }

    if (query.q) {
      filters.push(
        sql`(${orders.referenceCode} ilike ${`%${query.q}%`} or ${users.email} ilike ${`%${query.q}%`})`,
      )
    }

    const rows = await db
      .select({
        amount: orders.amount,
        couponCode: orders.couponCode,
        courseId: orders.courseId,
        courseSlug: courses.slug,
        courseTitle: courses.title,
        createdAt: orders.createdAt,
        currency: orders.currency,
        discountAmount: orders.discountAmount,
        id: orders.id,
        paymentMethod: orders.paymentMethod,
        proofScreenshotUrl: orders.proofScreenshotUrl,
        referenceCode: orders.referenceCode,
        rejectionReason: orders.rejectionReason,
        reviewedAt: orders.reviewedAt,
        reviewedByEmail: sql<string>`null`,
        senderNumber: orders.senderNumber,
        status: orders.status,
        studentEmail: users.email,
        studentName: profiles.fullName,
        studentProfileId: profiles.id,
        transactionId: orders.transactionId,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .innerJoin(courses, eq(orders.courseId, courses.id))
      .innerJoin(profiles, eq(orders.userId, profiles.id))
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(and(...filters))
      .orderBy(query.sort === "created_asc" ? asc(orders.createdAt) : desc(orders.createdAt))

    response.status(200).json({
      orders: (rows as OrderRow[]).map(toOrderDto),
    } satisfies AdminPendingPaymentsResponse)
  }),
)

paymentsRouter.post(
  "/admin/orders/:orderId/approve",
  requireAuth,
  requireRole(["admin"]),
  asyncHandler(async (request, response) => {
    const { orderId } = orderParamsSchema.parse(request.params)
    const order = await getOrderForViewer(orderId)

    if (!order) {
      throw new HttpError(404, "Order not found.")
    }

    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({
          rejectionReason: null,
          reviewedAt: new Date(),
          reviewedBy: request.auth!.profile.id,
          status: "paid",
        })
        .where(eq(orders.id, orderId))

      await tx
        .insert(enrollments)
        .values({
          courseId: order.courseId,
          orderId,
          userId: order.studentProfileId,
        })
        .onConflictDoNothing()
    })

    const updatedOrder = toOrderDto((await getOrderForViewer(orderId))!)

    await notifyPaymentApproved(updatedOrder)
    response.status(200).json(updatedOrder)
  }),
)

paymentsRouter.post(
  "/admin/orders/:orderId/reject",
  requireAuth,
  requireRole(["admin"]),
  asyncHandler(async (request, response) => {
    const { orderId } = orderParamsSchema.parse(request.params)
    const input = rejectionSchema.parse(request.body)
    const order = await getOrderForViewer(orderId)

    if (!order) {
      throw new HttpError(404, "Order not found.")
    }

    await db
      .update(orders)
      .set({
        rejectionReason: input.reason,
        reviewedAt: new Date(),
        reviewedBy: request.auth!.profile.id,
        status: "rejected",
      })
      .where(eq(orders.id, orderId))

    const updatedOrder = toOrderDto((await getOrderForViewer(orderId))!)

    await notifyPaymentRejected(updatedOrder, input.reason)
    response.status(200).json(updatedOrder)
  }),
)
