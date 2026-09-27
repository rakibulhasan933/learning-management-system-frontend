import { randomBytes } from "node:crypto"
import {
  and,
  courses,
  desc,
  enrollments,
  eq,
  orders,
  profiles,
  siteSettings,
  sql,
  users,
  alias,
} from "@workspace/db"
import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type {
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
import { createNotification } from "../lib/notifications.js"
import {
  sendPaymentApprovedEmail,
} from "../lib/mailer.js"
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
const couponPreviewSchema = z.object({
  couponCode: z.string().trim().min(1).max(64).optional(),
  courseId: z.string().uuid(),
})
const orderParamsSchema = z.object({
  orderId: z.string().uuid(),
})
const proofSubmissionSchema = z.object({
  paymentMethod: z.enum(paymentMethods).optional(),
  proofScreenshotUrl: z.string().trim().url().optional(),
  senderNumber: z.string().trim().min(4).max(64),
  transactionId: z.string().trim().min(3).max(255),
})

type OrderRow = {
  amount: string
  couponCode: string | null
  courseId: string
  courseSlug: string
  courseTitle: string
  thumbnailUrl: string | null
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
    thumbnailUrl: row.thumbnailUrl,
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

async function getSetting(key: string) {
  const [row] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, key)).limit(1)
  return row?.value ?? null
}

async function getInstructions(): Promise<ManualPaymentInstructionsDto> {
  const [bankDetails, paymentInstructions, bkashNumber, nagadNumber, rocketNumber] = await Promise.all([
    getSetting("payment_bank_details"), getSetting("payment_instructions"), getSetting("payment_bkash_number"), getSetting("payment_nagad_number"), getSetting("payment_rocket_number"),
  ])
  return {
    bankDetails: bankDetails ?? paymentInstructions ?? env.MANUAL_PAYMENT_BANK_DETAILS ?? null,
    bkashNumber: bkashNumber ?? env.MANUAL_PAYMENT_BKASH_NUMBER ?? null,
    nagadNumber: nagadNumber ?? env.MANUAL_PAYMENT_NAGAD_NUMBER ?? null,
    rocketNumber: rocketNumber ?? env.MANUAL_PAYMENT_ROCKET_NUMBER ?? null,
  }
}

async function parseCoupons() {
  const coupons: Record<string, { type: "amount" | "percent"; value: number }> = {}

  const configuredCoupons = (await getSetting("payment_coupons")) ?? env.MANUAL_PAYMENT_COUPONS ?? ""
  for (const entry of configuredCoupons.split(",")) {
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

async function applyCoupon(price: number, couponCode: string | undefined) {
  if (!couponCode) {
    return { amount: toMoney(price), couponCode: null, discountAmount: "0.00" }
  }

  const normalizedCode = couponCode.toUpperCase()
  const coupon = (await parseCoupons())[normalizedCode]

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
      thumbnailUrl: courses.thumbnailUrl,
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
      amount: order.amount,
      courseTitle: order.courseTitle,
      dashboardUrl: new URL("/dashboard/student", env.CORS_ORIGIN).toString(),
      email: order.studentEmail,
      referenceCode: order.referenceCode,
      transactionId: order.transactionId,
    })
  } catch (error) {
    console.error("Payment approval email failed.", error)
  }
}

const defaultPayConfirmUrl = "https://api-payconfirm.duckdns.org/api/v1/verify"

function maskPaymentValue(value: string) {
  const trimmed = value.trim()
  return trimmed.length <= 4 ? "****" : `${trimmed.slice(0, 2)}****${trimmed.slice(-2)}`
}

function maskId(value: string | null | undefined) {
  if (!value) return null
  return `${value.slice(0, 8)}…${value.slice(-4)}`
}

async function verifyPaymentWithPayConfirm({
  amount,
  senderNumber,
  transactionId,
}: {
  amount: string
  senderNumber: string
  transactionId: string
}) {
  const payConfirmUrl = env.PAYCONFIRM_API_URL ?? defaultPayConfirmUrl
  console.info("[payment] Pay-Confirm verification started", {
    amount,
    senderNumber: maskPaymentValue(senderNumber),
    transactionId: maskPaymentValue(transactionId),
    url: payConfirmUrl,
  })

  if (!env.PAYCONFIRM_API_KEY) {
    console.error("[payment] PAYCONFIRM_API_KEY is missing")
    throw new HttpError(503, "Payment verification is not configured yet.")
  }

  let providerResponse: Response

  try {
    providerResponse = await fetch(payConfirmUrl, {
      body: JSON.stringify({
        amount,
        sender_phone_number: senderNumber,
        trx_id: transactionId,
      }),
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${env.PAYCONFIRM_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    console.error("[payment] Pay-Confirm request failed", {
      error: error instanceof Error ? error.message : String(error),
      transactionId: maskPaymentValue(transactionId),
    })
    throw new HttpError(502, "Payment verification service is unavailable. Try again shortly.")
  }

  const responseText = await providerResponse.text()
  const payload = (() => {
    try {
      return JSON.parse(responseText) as { reason?: string; status?: string; error?: string }
    } catch {
      return null
    }
  })()

  if (providerResponse.status === 404) {
    console.error("[payment] Pay-Confirm verification endpoint returned 404", {
      contentType: providerResponse.headers.get("content-type"),
      url: payConfirmUrl,
    })
    throw new HttpError(503, "Payment verification endpoint is unavailable. Check PAYCONFIRM_API_URL.")
  }

  if (providerResponse.ok && payload?.status === "approved") {
    return
  }

  const reason = payload?.reason ?? payload?.status ?? payload?.error ?? "verification_failed"
  console.warn("[payment] Pay-Confirm rejected payment", {
    providerStatus: providerResponse.status,
    reason,
    responseStatus: payload?.status ?? null,
    transactionId: maskPaymentValue(transactionId),
  })
  const messages: Record<string, string> = {
    already_used: "This transaction has already been used.",
    amount_mismatch: "The payment amount does not match this order.",
    invalid_amount: "The order amount could not be verified.",
    invalid_request: "The payment verification request is invalid.",
    invalid_sender: "Please enter a valid sender phone number.",
    pending_or_not_found: "This transaction has not arrived yet. Try again after a few minutes.",
    reversed: "This payment was reversed or refunded.",
    sender_mismatch: "The sender phone number does not match the transaction.",
    sender_unverifiable: "The payment sender could not be verified. Try another transaction.",
  }

  const status = [400, 404, 409, 422].includes(providerResponse.status)
    ? providerResponse.status
    : 502

  throw new HttpError(status, messages[reason] ?? "Payment could not be verified.")
}

paymentsRouter.post(
  "/coupons/preview",
  requireAuth,
  requireRole(["admin", "student"]),
  asyncHandler(async (request, response) => {
    const input = couponPreviewSchema.parse(request.body)
    const [course] = await db.select({ currency: courses.currency, price: courses.price, status: courses.status }).from(courses).where(eq(courses.id, input.courseId)).limit(1)
    if (!course || course.status !== "published") throw new HttpError(404, "Course not found.")
    const pricing = await applyCoupon(Number(course.price), input.couponCode)
    response.json({ currency: course.currency, discountAmount: pricing.discountAmount, amount: pricing.amount, originalAmount: toMoney(Number(course.price)), couponCode: pricing.couponCode })
  }),
)

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
        instructions: await getInstructions(),
        order: toOrderDto(order!),
      } satisfies PaymentInstructionsResponse)
      return
    }

    const price = Number(course.price)
    const pricing = await applyCoupon(price, input.couponCode)
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
      instructions: await getInstructions(),
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
      console.warn("[payment] Order access denied", {
        currentProfileId: maskId(request.auth!.profile.id),
        orderId,
        orderOwnerProfileId: maskId(order.studentProfileId),
        role: request.auth!.profile.role,
        route: "instructions",
      })
      throw new HttpError(403, "Access denied.")
    }

    response.status(200).json({
      instructions: await getInstructions(),
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

    console.info("[payment] Proof submission received", {
      amount: order?.amount ?? null,
      orderId,
      senderNumber: maskPaymentValue(input.senderNumber),
      transactionId: maskPaymentValue(input.transactionId),
    })

    if (!order) {
      throw new HttpError(404, "Order not found.")
    }

    if (
      request.auth!.profile.role !== "admin" &&
      order.studentProfileId !== request.auth!.profile.id
    ) {
      console.warn("[payment] Order access denied", {
        currentProfileId: maskId(request.auth!.profile.id),
        orderId,
        orderOwnerProfileId: maskId(order.studentProfileId),
        role: request.auth!.profile.role,
        route: "proof",
      })
      throw new HttpError(403, "Access denied.")
    }

    if (order.status === "paid") {
      throw new HttpError(409, "This order is already paid.")
    }

    const proofScreenshotUrl = input.proofScreenshotUrl ?? order.proofScreenshotUrl

    await verifyPaymentWithPayConfirm({
      amount: order.amount,
      senderNumber: input.senderNumber,
      transactionId: input.transactionId,
    })

    await db
      .update(orders)
      .set({
        paymentMethod: input.paymentMethod ?? order.paymentMethod,
        proofScreenshotUrl,
        rejectionReason: null,
        reviewedAt: new Date(),
        reviewedBy: null,
        senderNumber: input.senderNumber,
        status: "paid",
        transactionId: input.transactionId,
      })
      .where(eq(orders.id, orderId))

    await db
      .insert(enrollments)
      .values({
        courseId: order.courseId,
        orderId,
        userId: order.studentProfileId,
      })
      .onConflictDoNothing()

    const updatedOrder = await getOrderForViewer(orderId)

    await notifyPaymentApproved(toOrderDto(updatedOrder!))
    const [course] = await db.select({ id: courses.id, instructorId: courses.instructorId, title: courses.title }).from(courses).where(eq(courses.id, order.courseId)).limit(1)
    if (course) {
      await createNotification({ body: `A new student enrolled in ${course.title}.`, href: `/dashboard/instructor/courses/${course.id}/students`, profileId: course.instructorId, title: "New course enrollment", type: "new_enrollment" })
    }

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
        thumbnailUrl: courses.thumbnailUrl,
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
