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
  auditLogs,
  categories,
  courses,
  desc,
  enrollments,
  eq,
  notifications,
  orders,
  profiles,
  payoutRequests,
  refunds,
  siteSettings,
  sql,
  users,
} from "@workspace/db"
import { alias } from "@workspace/db"

import { asyncHandler, HttpError } from "../http/errors.js"
import { db } from "../lib/database.js"
import { requireAuth, requireRole } from "../middleware/auth.js"
import { getR2StorageUsage } from "../lib/r2.js"

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
const categorySchema = z.object({
  description: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
})
const settingsSchema = z.object({
  settings: z.record(z.string(), z.string().max(10_000)),
})
const adminAnnouncementSchema = z.object({
  audience: z.enum(["students", "instructors", "all"]),
  body: z.string().trim().min(1).max(10_000),
  title: z.string().trim().min(1).max(255),
})
const refundCreateSchema = z.object({
  amount: z.coerce.number().positive(),
  orderId: z.string().uuid(),
  reason: z.string().trim().min(1).max(2000),
})
const refundDecisionSchema = z.object({
  reason: z.string().trim().max(2000).optional(),
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
const enrollmentStudentProfiles = alias(profiles, "admin_enrollment_student_profiles")
const enrollmentStudentUsers = alias(users, "admin_enrollment_student_users")
const refundStudentProfiles = alias(profiles, "admin_refund_student_profiles")
const refundStudentUsers = alias(users, "admin_refund_student_users")
const refundReviewerProfiles = alias(profiles, "admin_refund_reviewer_profiles")
const refundReviewerUsers = alias(users, "admin_refund_reviewer_users")

function serializeDate(value: Date | null) {
  return value ? value.toISOString() : null
}

function toNumber(value: unknown) {
  return Number(value ?? 0)
}

async function recordAudit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
) {
  await db.insert(auditLogs).values({ actorId, action, entityId, entityType, metadata })
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
  category: string | null
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
    category: row.category,
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
  "/health",
  asyncHandler(async (_request, response) => {
    const [counts] = await db.execute<{
      failed_uploads: number
      failed_payments: number
      unpublished_courses: number
      empty_courses: number
      storage_usage: string
    }>(sql`
      select
        (select count(*)::int from videos where video_ref is null) as failed_uploads,
        (select count(*)::int from orders where status = 'rejected') as failed_payments,
        (select count(*)::int from courses where status <> 'published') as unpublished_courses,
        (select count(*)::int from courses c where not exists (select 1 from sections s where s.course_id = c.id)) as empty_courses,
        'unavailable'::text as storage_usage
    `)
    if (!counts) throw new HttpError(500, "Health metrics are unavailable.")
    const storage = await getR2StorageUsage()
    response.json({ failedUploads: Number(counts.failed_uploads), failedPayments: Number(counts.failed_payments), unpublishedCourses: Number(counts.unpublished_courses), emptyCourses: Number(counts.empty_courses), storageUsage: storage ? `${storage.objects} objects · ${(storage.bytes / (1024 ** 3)).toFixed(2)} GB` : counts.storage_usage, errorMonitoring: "Application logs" })
  }),
)

adminRouter.get(
  "/reports/:report",
  asyncHandler(async (request, response) => {
    const report = z.enum(["users", "courses", "payments", "revenue", "enrollments"]).parse(request.params.report)
    const queries = {
      users: sql`select u.email, p.full_name, p.role, u.created_at, u.suspended_at from users u join profiles p on p.user_id = u.id order by u.created_at desc`,
      courses: sql`select title, slug, status, price, currency, created_at, updated_at from courses order by created_at desc`,
      payments: sql`select reference_code, transaction_id, amount, currency, status, payment_method, created_at, updated_at from orders order by created_at desc`,
      revenue: sql`select to_char(date_trunc('month', created_at), 'YYYY-MM') as month, count(*)::int as orders, coalesce(sum(amount), 0)::text as revenue from orders where status = 'paid' group by date_trunc('month', created_at) order by date_trunc('month', created_at) desc`,
      enrollments: sql`select u.email as student_email, c.title as course_title, e.status, e.enrolled_at, e.revoked_at from enrollments e join profiles p on p.id = e.user_id join users u on u.id = p.user_id join courses c on c.id = e.course_id order by e.enrolled_at desc`,
    }
    const rows = await db.execute(queries[report])
    response.json({ rows })
  }),
)

adminRouter.get(
  "/categories",
  asyncHandler(async (_request, response) => {
    const rows = await db.select().from(categories).orderBy(categories.name)
    response.status(200).json({ categories: rows })
  }),
)

adminRouter.post(
  "/categories",
  asyncHandler(async (request, response) => {
    const input = categorySchema.parse(request.body)
    const [created] = await db.insert(categories).values(input).returning()
    if (!created) throw new HttpError(500, "Category could not be created.")
    await recordAudit(request.auth!.profile.id, "category_created", "category", created.id, { name: created.name })
    response.status(201).json(created)
  }),
)

adminRouter.patch(
  "/categories/:id",
  asyncHandler(async (request, response) => {
    const params = idParamsSchema.parse(request.params)
    const input = categorySchema.partial().parse(request.body)
    const [updated] = await db.update(categories).set(input).where(eq(categories.id, params.id)).returning()
    if (!updated) throw new HttpError(404, "Category not found.")
    await recordAudit(request.auth!.profile.id, "category_updated", "category", updated.id, { name: updated.name })
    response.status(200).json(updated)
  }),
)

adminRouter.delete(
  "/categories/:id",
  asyncHandler(async (request, response) => {
    const params = idParamsSchema.parse(request.params)
    const [deleted] = await db.delete(categories).where(eq(categories.id, params.id)).returning({ id: categories.id })
    if (!deleted) throw new HttpError(404, "Category not found.")
    await recordAudit(request.auth!.profile.id, "category_deleted", "category", deleted.id)
    response.status(204).send()
  }),
)

adminRouter.get(
  "/settings",
  asyncHandler(async (_request, response) => {
    const rows = await db.select().from(siteSettings)
    response.status(200).json({
      settings: Object.fromEntries(rows.map((row) => [row.key, row.value])),
    })
  }),
)

adminRouter.put(
  "/settings",
  asyncHandler(async (request, response) => {
    const input = settingsSchema.parse(request.body)
    await db.transaction(async (tx) => {
      for (const [key, value] of Object.entries(input.settings)) {
        await tx.insert(siteSettings).values({ key, updatedBy: request.auth!.profile.id, value }).onConflictDoUpdate({
          target: siteSettings.key,
          set: { updatedBy: request.auth!.profile.id, updatedAt: new Date(), value },
        })
      }
    })
    await recordAudit(request.auth!.profile.id, "settings_updated", "site_settings", null, { keys: Object.keys(input.settings) })
    response.status(204).send()
  }),
)

adminRouter.post(
  "/announcements",
  asyncHandler(async (request, response) => {
    const input = adminAnnouncementSchema.parse(request.body)
    const roleFilter = input.audience === "all" ? undefined : eq(profiles.role, input.audience === "students" ? "student" : "instructor")
    const recipients = await db.select({ profileId: profiles.id }).from(profiles).where(roleFilter)
    if (recipients.length > 0) {
      await db.insert(notifications).values(recipients.map((recipient) => ({
        body: input.body,
        profileId: recipient.profileId,
        title: input.title,
        type: "admin_announcement",
      })))
    }
    await recordAudit(request.auth!.profile.id, "announcement_sent", "notification", null, { audience: input.audience, recipientCount: recipients.length })
    response.status(201).json({ recipientCount: recipients.length })
  }),
)

adminRouter.get(
  "/audit-logs",
  asyncHandler(async (request, response) => {
    const limit = Math.min(Math.max(Number(request.query.limit ?? 100), 1), 500)
    const rows = await db.select({
      action: auditLogs.action,
      actorEmail: users.email,
      createdAt: auditLogs.createdAt,
      entityId: auditLogs.entityId,
      entityType: auditLogs.entityType,
      id: auditLogs.id,
      metadata: auditLogs.metadata,
    }).from(auditLogs).leftJoin(profiles, eq(auditLogs.actorId, profiles.id)).leftJoin(users, eq(profiles.userId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(limit)
    response.status(200).json({ logs: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })) })
  }),
)

adminRouter.get(
  "/enrollments",
  asyncHandler(async (_request, response) => {
    const rows = await db.select({
      courseId: courses.id,
      courseTitle: courses.title,
      enrolledAt: enrollments.enrolledAt,
      id: enrollments.id,
      orderId: enrollments.orderId,
      revokedAt: enrollments.revokedAt,
      status: enrollments.status,
      studentEmail: enrollmentStudentUsers.email,
      studentName: enrollmentStudentProfiles.fullName,
    }).from(enrollments).innerJoin(courses, eq(enrollments.courseId, courses.id)).innerJoin(enrollmentStudentProfiles, eq(enrollments.userId, enrollmentStudentProfiles.id)).innerJoin(enrollmentStudentUsers, eq(enrollmentStudentProfiles.userId, enrollmentStudentUsers.id)).orderBy(desc(enrollments.enrolledAt))
    response.status(200).json({ enrollments: rows.map((row) => ({ ...row, enrolledAt: row.enrolledAt.toISOString(), revokedAt: serializeDate(row.revokedAt) })) })
  }),
)

adminRouter.patch(
  "/enrollments/:id/:action",
  asyncHandler(async (request, response) => {
    const params = z.object({ action: z.enum(["activate", "revoke"]), id: z.string().uuid() }).parse(request.params)
    const status = params.action === "activate" ? "active" : "revoked"
    const [updated] = await db.update(enrollments).set({ revokedAt: status === "active" ? null : new Date(), status }).where(eq(enrollments.id, params.id)).returning({ id: enrollments.id })
    if (!updated) throw new HttpError(404, "Enrollment not found.")
    await recordAudit(request.auth!.profile.id, `enrollment_${params.action}d`, "enrollment", updated.id)
    response.status(204).send()
  }),
)

adminRouter.get(
  "/refunds",
  asyncHandler(async (_request, response) => {
    const rows = await db.select({
      amount: refunds.amount,
      courseTitle: courses.title,
      createdAt: refunds.createdAt,
      currency: refunds.currency,
      id: refunds.id,
      orderId: refunds.orderId,
      reason: refunds.reason,
      reviewedAt: refunds.reviewedAt,
      reviewedByEmail: refundReviewerUsers.email,
      status: refunds.status,
      studentEmail: refundStudentUsers.email,
      processedAt: refunds.processedAt,
    }).from(refunds).innerJoin(orders, eq(refunds.orderId, orders.id)).innerJoin(courses, eq(orders.courseId, courses.id)).innerJoin(refundStudentProfiles, eq(orders.userId, refundStudentProfiles.id)).innerJoin(refundStudentUsers, eq(refundStudentProfiles.userId, refundStudentUsers.id)).leftJoin(refundReviewerProfiles, eq(refunds.reviewedBy, refundReviewerProfiles.id)).leftJoin(refundReviewerUsers, eq(refundReviewerProfiles.userId, refundReviewerUsers.id)).orderBy(desc(refunds.createdAt))
    response.status(200).json({ refunds: rows.map((row) => ({ ...row, amount: String(row.amount), createdAt: row.createdAt.toISOString(), processedAt: serializeDate(row.processedAt), reviewedAt: serializeDate(row.reviewedAt) })) })
  }),
)

adminRouter.post(
  "/refunds",
  asyncHandler(async (request, response) => {
    const input = refundCreateSchema.parse(request.body)
    const [order] = await db.select({ amount: orders.amount, courseId: orders.courseId, currency: orders.currency, status: orders.status }).from(orders).where(eq(orders.id, input.orderId)).limit(1)
    if (!order || order.status !== "paid") throw new HttpError(400, "Only paid orders can be refunded.")
    if (input.amount > Number(order.amount)) throw new HttpError(400, "Refund amount exceeds the paid amount.")
    const [created] = await db.insert(refunds).values({ amount: input.amount.toFixed(2), currency: order.currency, orderId: input.orderId, reason: input.reason, requestedBy: request.auth!.profile.id }).returning()
    if (!created) throw new HttpError(500, "Refund request could not be created.")
    await recordAudit(request.auth!.profile.id, "refund_requested", "refund", created.id, { orderId: input.orderId })
    response.status(201).json(created)
  }),
)

adminRouter.post(
  "/refunds/:id/:action",
  asyncHandler(async (request, response) => {
    const params = z.object({ action: z.enum(["approve", "reject", "process"]), id: z.string().uuid() }).parse(request.params)
    const input = refundDecisionSchema.parse(request.body ?? {})
    const nextStatus = params.action === "approve" ? "approved" : params.action === "reject" ? "rejected" : "processed"
    const [updated] = await db.update(refunds).set({ reason: input.reason ?? undefined, reviewedBy: request.auth!.profile.id, reviewedAt: new Date(), processedAt: nextStatus === "processed" ? new Date() : undefined, status: nextStatus }).where(eq(refunds.id, params.id)).returning({ id: refunds.id })
    if (!updated) throw new HttpError(404, "Refund not found.")
    await recordAudit(request.auth!.profile.id, `refund_${params.action}d`, "refund", updated.id)
    response.status(204).send()
  }),
)

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

adminRouter.patch(
  "/courses/:id/category",
  asyncHandler(async (request, response) => {
    const params = idParamsSchema.parse(request.params)
    const input = z.object({ category: z.string().trim().max(140).nullable() }).parse(request.body)
    const [updated] = await db.update(courses).set({ category: input.category }).where(eq(courses.id, params.id)).returning({ id: courses.id, category: courses.category })
    if (!updated) throw new HttpError(404, "Course not found.")
    await recordAudit(request.auth!.profile.id, "course_category_assigned", "course", updated.id, { category: updated.category })
    response.json(updated)
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

    await recordAudit(request.auth!.profile.id, "user_suspended", "user", params.id)
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

    await recordAudit(request.auth!.profile.id, "user_activated", "user", params.id)
    response.status(204).send()
  }),
)

adminRouter.get(
  "/courses/pending",
  asyncHandler(async (_request, response) => {
    const rows = await db
      .select({
        category: courses.category,
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

    await recordAudit(request.auth!.profile.id, "course_approved", "course", params.id)
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

    await recordAudit(request.auth!.profile.id, "course_rejected", "course", params.id)
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

    await recordAudit(request.auth!.profile.id, "payout_approved", "payout", params.id)
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

    await recordAudit(request.auth!.profile.id, "payout_rejected", "payout", params.id)
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

    await recordAudit(request.auth!.profile.id, "payout_paid", "payout", params.id)
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
