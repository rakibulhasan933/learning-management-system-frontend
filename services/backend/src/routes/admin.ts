import bcrypt from "bcryptjs"
import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type {
  AdminCreateInstructorRequest,
  AdminCreateInstructorResponse,
  AdminPayoutListResponse,
  AdminCourseApprovalQueueResponse,
  AdminCourseReviewDto,
  AdminRevenueOverviewResponse,
  AdminUserDto,
  AdminUserListResponse,
  PayoutRequestDto,
} from "@workspace/types"
import {
  and,
  courses,
  desc,
  eq,
  profiles,
  payoutRequests,
  sql,
  users,
} from "@workspace/db"
import { alias } from "@workspace/db"

import { asyncHandler, HttpError } from "../http/errors.js"
import { db } from "../lib/database.js"
import { requireAuth, requireRole } from "../middleware/auth.js"

export const adminRouter: ExpressRouter = Router()

const userQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  role: z.enum(["admin", "instructor", "student"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
})
const idParamsSchema = z.object({
  id: z.string().uuid(),
})
const createInstructorSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  fullName: z.string().trim().min(1).max(160).nullable().optional(),
  password: z.string().min(8),
})
const payoutRejectSchema = z.object({
  rejectionReason: z.string().trim().min(1).max(2000),
})

const instructorProfiles = alias(profiles, "admin_course_instructor_profiles")
const instructorUsers = alias(users, "admin_course_instructor_users")
const payoutInstructorProfiles = alias(
  profiles,
  "admin_payout_instructor_profiles",
)
const payoutInstructorUsers = alias(users, "admin_payout_instructor_users")
const payoutReviewerProfiles = alias(
  profiles,
  "admin_payout_reviewer_profiles",
)
const payoutReviewerUsers = alias(users, "admin_payout_reviewer_users")

function serializeDate(value: Date | null) {
  return value ? value.toISOString() : null
}

function toNumber(value: unknown) {
  return Number(value ?? 0)
}

const adminUserSelect = {
  authProvider: users.authProvider,
  createdAt: users.createdAt,
  email: users.email,
  emailVerifiedAt: users.emailVerifiedAt,
  fullName: profiles.fullName,
  id: users.id,
  profileId: profiles.id,
  role: profiles.role,
  suspendedAt: users.suspendedAt,
} as const

function toAdminUserDto(row: {
  authProvider: AdminUserDto["authProvider"]
  createdAt: Date
  email: string
  emailVerifiedAt: Date | null
  fullName: string | null
  id: string
  profileId: string
  role: AdminUserDto["role"]
  suspendedAt: Date | null
}): AdminUserDto {
  return {
    authProvider: row.authProvider,
    createdAt: row.createdAt.toISOString(),
    email: row.email,
    emailVerifiedAt: serializeDate(row.emailVerifiedAt),
    fullName: row.fullName,
    id: row.id,
    profileId: row.profileId,
    role: row.role,
    suspendedAt: serializeDate(row.suspendedAt),
  }
}

function toCourseReviewDto(row: {
  currency: string
  id: string
  instructorEmail: string
  instructorName: string | null
  price: string
  slug: string
  status: AdminCourseReviewDto["status"]
  title: string
  updatedAt: Date
}): AdminCourseReviewDto {
  return {
    currency: row.currency,
    id: row.id,
    instructorEmail: row.instructorEmail,
    instructorName: row.instructorName,
    price: row.price,
    slug: row.slug,
    status: row.status,
    submittedAt: row.updatedAt.toISOString(),
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toPayoutRequestDto(row: {
  amount: string
  createdAt: Date
  currency: string
  id: string
  instructorEmail: string
  instructorId: string
  instructorName: string | null
  note: string | null
  paidAt: Date | null
  referenceCode: string
  rejectionReason: string | null
  reviewedAt: Date | null
  reviewedByEmail: string | null
  status: PayoutRequestDto["status"]
  updatedAt: Date
}): PayoutRequestDto {
  return {
    amount: row.amount,
    createdAt: row.createdAt.toISOString(),
    currency: row.currency,
    id: row.id,
    instructorEmail: row.instructorEmail,
    instructorId: row.instructorId,
    instructorName: row.instructorName,
    note: row.note,
    paidAt: serializeDate(row.paidAt),
    referenceCode: row.referenceCode,
    rejectionReason: row.rejectionReason,
    reviewedAt: serializeDate(row.reviewedAt),
    reviewedByEmail: row.reviewedByEmail,
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
  }
}

adminRouter.use(requireAuth, requireRole(["admin"]))

adminRouter.get(
  "/users",
  asyncHandler(async (request, response) => {
    const query = userQuerySchema.parse(request.query)
    const filters = []

    if (query.q) {
      filters.push(
        sql`(${users.email} ilike ${`%${query.q}%`} or ${profiles.fullName} ilike ${`%${query.q}%`})`,
      )
    }

    if (query.role) {
      filters.push(eq(profiles.role, query.role))
    }

    if (query.status === "active") {
      filters.push(sql`${users.suspendedAt} is null`)
    }

    if (query.status === "suspended") {
      filters.push(sql`${users.suspendedAt} is not null`)
    }

    const rows = await db
      .select({
        authProvider: users.authProvider,
        createdAt: users.createdAt,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
        fullName: profiles.fullName,
        id: users.id,
        profileId: profiles.id,
        role: profiles.role,
        suspendedAt: users.suspendedAt,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(users.createdAt))

    response.status(200).json({
    users: rows.map(toAdminUserDto),
  } satisfies AdminUserListResponse)
  }),
)

adminRouter.post(
  "/users/instructors",
  asyncHandler(async (request, response) => {
    const input = createInstructorSchema.parse(
      request.body,
    ) as AdminCreateInstructorRequest
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    })

    if (existingUser) {
      throw new HttpError(409, "An account with this email already exists.")
    }

    const passwordHash = await bcrypt.hash(input.password, 12)
    const createdUser = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          authProvider: "password",
          email: input.email,
          emailVerifiedAt: new Date(),
          passwordHash,
        })
        .returning()

      if (!user) {
        throw new HttpError(500, "Instructor account could not be created.")
      }

      const [profile] = await tx
        .insert(profiles)
        .values({
          fullName: input.fullName ?? null,
          role: "instructor",
          userId: user.id,
        })
        .returning()

      if (!profile) {
        throw new HttpError(500, "Instructor profile could not be created.")
      }

      return user
    })

    const [row] = await db
      .select(adminUserSelect)
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, createdUser.id))
      .limit(1)

    if (!row) {
      throw new HttpError(500, "Instructor account could not be loaded.")
    }

    response.status(201).json({
      user: toAdminUserDto(row),
    } satisfies AdminCreateInstructorResponse)
  }),
)

adminRouter.post(
  "/users/:id/suspend",
  asyncHandler(async (request, response) => {
    const params = idParamsSchema.parse(request.params)

    if (params.id === request.auth!.profile.userId) {
      throw new HttpError(400, "You cannot suspend your own account.")
    }

    const [updated] = await db
      .update(users)
      .set({ suspendedAt: new Date() })
      .where(eq(users.id, params.id))
      .returning({ id: users.id })

    if (!updated) {
      throw new HttpError(404, "User not found.")
    }

    response.status(204).send()
  }),
)

adminRouter.post(
  "/users/:id/activate",
  asyncHandler(async (request, response) => {
    const params = idParamsSchema.parse(request.params)
    const [updated] = await db
      .update(users)
      .set({ suspendedAt: null })
      .where(eq(users.id, params.id))
      .returning({ id: users.id })

    if (!updated) {
      throw new HttpError(404, "User not found.")
    }

    response.status(204).send()
  }),
)

adminRouter.get(
  "/courses/pending",
  asyncHandler(async (_request, response) => {
    const rows = await db
      .select({
        currency: courses.currency,
        id: courses.id,
        instructorEmail: instructorUsers.email,
        instructorName: instructorProfiles.fullName,
        price: courses.price,
        slug: courses.slug,
        status: courses.status,
        title: courses.title,
        updatedAt: courses.updatedAt,
      })
      .from(courses)
      .innerJoin(instructorProfiles, eq(courses.instructorId, instructorProfiles.id))
      .innerJoin(instructorUsers, eq(instructorProfiles.userId, instructorUsers.id))
      .where(eq(courses.status, "pending_review"))
      .orderBy(desc(courses.updatedAt))

    response.status(200).json({
      courses: rows.map(toCourseReviewDto),
    } satisfies AdminCourseApprovalQueueResponse)
  }),
)

adminRouter.post(
  "/courses/:id/approve",
  asyncHandler(async (request, response) => {
    const params = idParamsSchema.parse(request.params)
    const [updated] = await db
      .update(courses)
      .set({ publishedAt: new Date(), status: "published" })
      .where(and(eq(courses.id, params.id), eq(courses.status, "pending_review")))
      .returning({ id: courses.id })

    if (!updated) {
      throw new HttpError(404, "Pending course not found.")
    }

    response.status(204).send()
  }),
)

adminRouter.post(
  "/courses/:id/reject",
  asyncHandler(async (request, response) => {
    const params = idParamsSchema.parse(request.params)
    const [updated] = await db
      .update(courses)
      .set({ publishedAt: null, status: "archived" })
      .where(and(eq(courses.id, params.id), eq(courses.status, "pending_review")))
      .returning({ id: courses.id })

    if (!updated) {
      throw new HttpError(404, "Pending course not found.")
    }

    response.status(204).send()
  }),
)

adminRouter.get(
  "/payouts",
  asyncHandler(async (_request, response) => {
    const rows = await db
      .select({
        amount: payoutRequests.amount,
        createdAt: payoutRequests.createdAt,
        currency: payoutRequests.currency,
        id: payoutRequests.id,
        instructorEmail: payoutInstructorUsers.email,
        instructorId: payoutRequests.instructorId,
        instructorName: payoutInstructorProfiles.fullName,
        note: payoutRequests.note,
        paidAt: payoutRequests.paidAt,
        referenceCode: payoutRequests.referenceCode,
        rejectionReason: payoutRequests.rejectionReason,
        reviewedAt: payoutRequests.reviewedAt,
        reviewedByEmail: payoutReviewerUsers.email,
        status: payoutRequests.status,
        updatedAt: payoutRequests.updatedAt,
      })
      .from(payoutRequests)
      .innerJoin(
        payoutInstructorProfiles,
        eq(payoutRequests.instructorId, payoutInstructorProfiles.id),
      )
      .innerJoin(
        payoutInstructorUsers,
        eq(payoutInstructorProfiles.userId, payoutInstructorUsers.id),
      )
      .leftJoin(
        payoutReviewerProfiles,
        eq(payoutRequests.reviewedBy, payoutReviewerProfiles.id),
      )
      .leftJoin(
        payoutReviewerUsers,
        eq(payoutReviewerProfiles.userId, payoutReviewerUsers.id),
      )
      .orderBy(desc(payoutRequests.createdAt))

    response.status(200).json({
      payouts: rows.map((row) =>
        toPayoutRequestDto({
          amount: row.amount,
          createdAt: row.createdAt,
          currency: row.currency,
          id: row.id,
          instructorEmail: row.instructorEmail,
          instructorId: row.instructorId,
          instructorName: row.instructorName,
          note: row.note,
          paidAt: row.paidAt,
          referenceCode: row.referenceCode,
          rejectionReason: row.rejectionReason,
          reviewedAt: row.reviewedAt,
          reviewedByEmail: row.reviewedByEmail,
          status: row.status,
          updatedAt: row.updatedAt,
        }),
      ),
    } satisfies AdminPayoutListResponse)
  }),
)

adminRouter.post(
  "/payouts/:id/approve",
  asyncHandler(async (request, response) => {
    const params = idParamsSchema.parse(request.params)
    const [updated] = await db
      .update(payoutRequests)
      .set({
        paidAt: null,
        rejectionReason: null,
        reviewedAt: new Date(),
        reviewedBy: request.auth!.profile.id,
        status: "approved",
      })
      .where(and(eq(payoutRequests.id, params.id), eq(payoutRequests.status, "pending")))
      .returning({ id: payoutRequests.id })

    if (!updated) {
      throw new HttpError(404, "Pending payout request not found.")
    }

    response.status(204).send()
  }),
)

adminRouter.post(
  "/payouts/:id/reject",
  asyncHandler(async (request, response) => {
    const params = idParamsSchema.parse(request.params)
    const input = payoutRejectSchema.parse(request.body)
    const [updated] = await db
      .update(payoutRequests)
      .set({
        paidAt: null,
        rejectionReason: input.rejectionReason,
        reviewedAt: new Date(),
        reviewedBy: request.auth!.profile.id,
        status: "rejected",
      })
      .where(and(eq(payoutRequests.id, params.id), eq(payoutRequests.status, "pending")))
      .returning({ id: payoutRequests.id })

    if (!updated) {
      throw new HttpError(404, "Pending payout request not found.")
    }

    response.status(204).send()
  }),
)

adminRouter.post(
  "/payouts/:id/paid",
  asyncHandler(async (request, response) => {
    const params = idParamsSchema.parse(request.params)
    const [updated] = await db
      .update(payoutRequests)
      .set({
        reviewedAt: new Date(),
        reviewedBy: request.auth!.profile.id,
        status: "paid",
        paidAt: new Date(),
      })
      .where(and(eq(payoutRequests.id, params.id), eq(payoutRequests.status, "approved")))
      .returning({ id: payoutRequests.id })

    if (!updated) {
      throw new HttpError(404, "Approved payout request not found.")
    }

    response.status(204).send()
  }),
)

adminRouter.get(
  "/revenue",
  asyncHandler(async (_request, response) => {
    const [totals] = await db.execute<{
      active_enrollments: number
      active_users: number
      paid_orders: number
      paid_revenue: string
      pending_courses: number
      pending_orders: number
      pending_revenue: string
      published_courses: number
      suspended_users: number
    }>(sql`
      select
        (select count(*)::int from users where suspended_at is null) as active_users,
        (select count(*)::int from users where suspended_at is not null) as suspended_users,
        (select count(*)::int from courses where status = 'published') as published_courses,
        (select count(*)::int from courses where status = 'pending_review') as pending_courses,
        (select count(*)::int from enrollments where status = 'active') as active_enrollments,
        (select count(*)::int from orders where status = 'paid') as paid_orders,
        (select count(*)::int from orders where status = 'pending_verification') as pending_orders,
        (select coalesce(sum(amount), 0)::text from orders where status = 'paid') as paid_revenue,
        (select coalesce(sum(amount), 0)::text from orders where status = 'pending_verification') as pending_revenue
    `)

    const monthlyRows = await db.execute<{
      label: string
      orders: number
      revenue: string
    }>(sql`
      select to_char(date_trunc('month', created_at), 'Mon YYYY') as label,
             count(*)::int as orders,
             coalesce(sum(amount), 0)::text as revenue
      from orders
      where status = 'paid'
        and created_at >= date_trunc('month', now()) - interval '5 months'
      group by date_trunc('month', created_at)
      order by date_trunc('month', created_at)
    `)

    const methodRows = await db.execute<{
      label: string
      orders: number
      revenue: string
    }>(sql`
      select coalesce(payment_method::text, 'unrecorded') as label,
             count(*)::int as orders,
             coalesce(sum(amount), 0)::text as revenue
      from orders
      where status = 'paid'
      group by payment_method
      order by sum(amount) desc nulls last
    `)

    response.status(200).json({
      byMethod: methodRows.map((row) => ({
        label: row.label.replace("_", " "),
        orders: toNumber(row.orders),
        revenue: toNumber(row.revenue),
      })),
      byMonth: monthlyRows.map((row) => ({
        label: row.label,
        orders: toNumber(row.orders),
        revenue: toNumber(row.revenue),
      })),
      totals: {
        activeEnrollments: toNumber(totals?.active_enrollments),
        activeUsers: toNumber(totals?.active_users),
        paidOrders: toNumber(totals?.paid_orders),
        paidRevenue: toNumber(totals?.paid_revenue),
        pendingCourses: toNumber(totals?.pending_courses),
        pendingOrders: toNumber(totals?.pending_orders),
        pendingRevenue: toNumber(totals?.pending_revenue),
        publishedCourses: toNumber(totals?.published_courses),
        suspendedUsers: toNumber(totals?.suspended_users),
      },
    } satisfies AdminRevenueOverviewResponse)
  }),
)
