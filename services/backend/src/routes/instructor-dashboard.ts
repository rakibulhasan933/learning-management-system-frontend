import { randomBytes } from "node:crypto"

import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type {
  AnnouncementListResponse,
  DiscussionListResponse,
  InstructorQuizResultsResponse,
  InstructorAnalyticsOverviewResponse,
  InstructorCourseStudentsResponse,
  InstructorPayoutListResponse,
  PayoutRequestDto,
} from "@workspace/types"
import {
  and,
  alias,
  announcements,
  courses,
  desc,
  discussionPosts,
  enrollments,
  eq,
  inArray,
  modules,
  payoutRequests,
  profiles,
  videoProgress,
  quizAttempts,
  quizzes,
  notifications,
  sections,
  sql,
  users,
  videos,
} from "@workspace/db"

import { asyncHandler, HttpError } from "../http/errors.js"
import { db } from "../lib/database.js"
import { createNotification } from "../lib/notifications.js"
import { requireAuth, requireRole } from "../middleware/auth.js"

export const instructorDashboardRouter: ExpressRouter = Router()

const courseParamsSchema = z.object({
  courseId: z.string().uuid(),
})

const payoutCreateSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().trim().length(3).default("BDT"),
  note: z.string().trim().max(2000).optional(),
})
const discussionCreateSchema = z.object({
  body: z.string().trim().min(2).max(5000),
  lectureId: z.string().uuid().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
})
const announcementCreateSchema = z.object({
  body: z.string().trim().min(2).max(5000),
  title: z.string().trim().min(2).max(180),
})

function serializeDate(value: Date | null) {
  return value ? value.toISOString() : null
}

function toNumber(value: unknown) {
  return Number(value ?? 0)
}

function createReferenceCode(prefix: string) {
  return `${prefix}-${randomBytes(3).toString("hex").toUpperCase()}`
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

async function loadInstructorAnalytics(instructorId: string) {
  const courseRows = await db
    .select({
      currency: courses.currency,
      id: courses.id,
      price: courses.price,
      slug: courses.slug,
      status: courses.status,
      title: courses.title,
    })
    .from(courses)
    .where(eq(courses.instructorId, instructorId))
    .orderBy(desc(courses.updatedAt))

  if (courseRows.length === 0) {
    return {
      courses: [],
      totals: {
        activeEnrollmentCount: 0,
        availablePayoutBalance: 0,
        completedEnrollmentCount: 0,
        completionRate: 0,
        courseCount: 0,
        pendingPayoutRequestCount: 0,
        reservedPayoutAmount: 0,
        revenue: 0,
      },
    }
  }

  const courseIds = courseRows.map((course) => course.id)

  const lectureRows = await db
    .select({
      courseId: sections.courseId,
      lectureId: videos.id,
    })
    .from(videos)
    .innerJoin(modules, eq(videos.moduleId, modules.id))
    .innerJoin(sections, eq(modules.milestoneId, sections.id))
    .where(
      and(eq(videos.isPublished, true), inArray(sections.courseId, courseIds))
    )

  const lectureIdsByCourse = new Map<string, string[]>()
  const allLectureIds = new Set<string>()

  for (const row of lectureRows) {
    allLectureIds.add(row.lectureId)
    const lectureIds = lectureIdsByCourse.get(row.courseId) ?? []
    lectureIds.push(row.lectureId)
    lectureIdsByCourse.set(row.courseId, lectureIds)
  }

  const enrollmentRows = await db
    .select({
      courseId: enrollments.courseId,
      email: users.email,
      enrolledAt: enrollments.enrolledAt,
      enrollmentId: enrollments.id,
      fullName: profiles.fullName,
      revokedAt: enrollments.revokedAt,
      status: enrollments.status,
      userId: enrollments.userId,
    })
    .from(enrollments)
    .innerJoin(profiles, eq(enrollments.userId, profiles.id))
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(inArray(enrollments.courseId, courseIds))
    .orderBy(desc(enrollments.enrolledAt))

  const studentIds = [...new Set(enrollmentRows.map((row) => row.userId))]
  const progressRows =
    studentIds.length > 0 && allLectureIds.size > 0
      ? await db
          .select({
            completedAt: videoProgress.completedAt,
            isCompleted: videoProgress.isCompleted,
            lastWatchedAt: videoProgress.lastWatchedAt,
            lectureId: videoProgress.videoId,
            userId: videoProgress.userId,
          })
          .from(videoProgress)
          .where(
            and(
              inArray(videoProgress.userId, studentIds),
              inArray(videoProgress.videoId, [...allLectureIds])
            )
          )
      : []

  const progressByUserLecture = new Map<
    string,
    {
      completedAt: Date | null
      isCompleted: boolean
      lastWatchedAt: Date
    }
  >()

  for (const row of progressRows) {
    progressByUserLecture.set(`${row.userId}:${row.lectureId}`, {
      completedAt: row.completedAt,
      isCompleted: row.isCompleted,
      lastWatchedAt: row.lastWatchedAt,
    })
  }

  const revenueRows = await db.execute<{
    course_id: string
    orders_count: number
    revenue: string
  }>(sql`
    select
      c.id as course_id,
      count(o.id)::int as orders_count,
      coalesce(sum(o.amount), 0)::text as revenue
    from courses c
    left join orders o
      on o.course_id = c.id
      and o.status = 'paid'
    where c.instructor_id = ${instructorId}
    group by c.id
  `)

  const revenueByCourse = new Map<
    string,
    {
      ordersCount: number
      revenue: number
    }
  >()

  for (const row of revenueRows) {
    revenueByCourse.set(row.course_id, {
      ordersCount: toNumber(row.orders_count),
      revenue: toNumber(row.revenue),
    })
  }

  const payoutSummaryRows = await db.execute<{
    pending_payout_count: number
    reserved_amount: string
    total_revenue: string
  }>(sql`
    select
      coalesce((
        select count(*)
        from payout_requests
        where instructor_id = ${instructorId}
          and status = 'pending'
      ), 0)::int as pending_payout_count,
      coalesce((
        select sum(amount)
        from payout_requests
        where instructor_id = ${instructorId}
          and status in ('pending', 'approved', 'paid')
      ), 0)::text as reserved_amount,
      coalesce((
        select sum(amount)
        from orders
        inner join courses on courses.id = orders.course_id
        where courses.instructor_id = ${instructorId}
          and orders.status = 'paid'
      ), 0)::text as total_revenue
  `)

  const payoutSummary = payoutSummaryRows[0] ?? {
    pending_payout_count: 0,
    reserved_amount: "0",
    total_revenue: "0",
  }

  const coursesWithMetrics = courseRows.map((course) => {
    const courseLectureIds = lectureIdsByCourse.get(course.id) ?? []
    const courseEnrollments = enrollmentRows.filter(
      (row) => row.courseId === course.id
    )
    const activeEnrollments = courseEnrollments.filter(
      (row) => row.status === "active"
    )
    const completedEnrollmentCount = activeEnrollments.filter((row) =>
      courseLectureIds.every(
        (lectureId) =>
          progressByUserLecture.get(`${row.userId}:${lectureId}`)?.isCompleted
      )
    ).length
    const revenue = revenueByCourse.get(course.id)?.revenue ?? 0

    return {
      activeEnrollmentCount: activeEnrollments.length,
      completedEnrollmentCount,
      completionRate:
        activeEnrollments.length === 0
          ? 0
          : Math.round(
              (completedEnrollmentCount / activeEnrollments.length) * 100
            ),
      currency: course.currency,
      enrollmentCount: courseEnrollments.length,
      id: course.id,
      price: course.price,
      revenue,
      slug: course.slug,
      status: course.status,
      title: course.title,
      totalLectureCount: courseLectureIds.length,
    }
  })

  const totalActiveEnrollmentCount = coursesWithMetrics.reduce(
    (total, course) => total + course.activeEnrollmentCount,
    0
  )
  const totalCompletedEnrollmentCount = coursesWithMetrics.reduce(
    (total, course) => total + course.completedEnrollmentCount,
    0
  )
  const totalRevenue = toNumber(payoutSummary.total_revenue)
  const reservedPayoutAmount = toNumber(payoutSummary.reserved_amount)
  const availablePayoutBalance = Math.max(
    totalRevenue - reservedPayoutAmount,
    0
  )

  return {
    courses: coursesWithMetrics,
    payouts: {
      availablePayoutBalance,
      pendingPayoutRequestCount: toNumber(payoutSummary.pending_payout_count),
      reservedPayoutAmount,
      totalRevenue,
    },
    totals: {
      activeEnrollmentCount: totalActiveEnrollmentCount,
      availablePayoutBalance,
      completedEnrollmentCount: totalCompletedEnrollmentCount,
      completionRate:
        totalActiveEnrollmentCount === 0
          ? 0
          : Math.round(
              (totalCompletedEnrollmentCount / totalActiveEnrollmentCount) * 100
            ),
      courseCount: courseRows.length,
      pendingPayoutRequestCount: toNumber(payoutSummary.pending_payout_count),
      reservedPayoutAmount,
      revenue: totalRevenue,
    },
  }
}

async function loadInstructorPayoutList(instructorId: string) {
  const instructorProfiles = alias(
    profiles,
    "instructor_payout_instructor_profiles"
  )
  const instructorUsers = alias(users, "instructor_payout_instructor_users")
  const reviewerProfiles = alias(
    profiles,
    "instructor_payout_reviewer_profiles"
  )
  const reviewerUsers = alias(users, "instructor_payout_reviewer_users")

  const [summary, rows] = await Promise.all([
    db.execute<{
      pending_payout_count: number
      reserved_amount: string
      total_revenue: string
    }>(sql`
      select
        coalesce((
          select count(*)
          from payout_requests
          where instructor_id = ${instructorId}
            and status = 'pending'
        ), 0)::int as pending_payout_count,
        coalesce((
          select sum(amount)
          from payout_requests
          where instructor_id = ${instructorId}
            and status in ('pending', 'approved', 'paid')
        ), 0)::text as reserved_amount,
        coalesce((
          select sum(amount)
          from orders
          inner join courses on courses.id = orders.course_id
          where courses.instructor_id = ${instructorId}
            and orders.status = 'paid'
        ), 0)::text as total_revenue
    `),
    db
      .select({
        amount: payoutRequests.amount,
        createdAt: payoutRequests.createdAt,
        currency: payoutRequests.currency,
        id: payoutRequests.id,
        instructorEmail: instructorUsers.email,
        instructorId: payoutRequests.instructorId,
        instructorName: instructorProfiles.fullName,
        note: payoutRequests.note,
        paidAt: payoutRequests.paidAt,
        referenceCode: payoutRequests.referenceCode,
        rejectionReason: payoutRequests.rejectionReason,
        reviewedAt: payoutRequests.reviewedAt,
        reviewedByEmail: reviewerUsers.email,
        status: payoutRequests.status,
        updatedAt: payoutRequests.updatedAt,
      })
      .from(payoutRequests)
      .innerJoin(
        instructorProfiles,
        eq(payoutRequests.instructorId, instructorProfiles.id)
      )
      .innerJoin(
        instructorUsers,
        eq(instructorProfiles.userId, instructorUsers.id)
      )
      .leftJoin(
        reviewerProfiles,
        eq(payoutRequests.reviewedBy, reviewerProfiles.id)
      )
      .leftJoin(reviewerUsers, eq(reviewerProfiles.userId, reviewerUsers.id))
      .where(eq(payoutRequests.instructorId, instructorId))
      .orderBy(desc(payoutRequests.createdAt)),
  ])

  const payoutSummary = summary[0] ?? {
    pending_payout_count: 0,
    reserved_amount: "0",
    total_revenue: "0",
  }
  const totalRevenue = toNumber(payoutSummary.total_revenue)
  const reservedPayoutAmount = toNumber(payoutSummary.reserved_amount)
  const availablePayoutBalance = Math.max(
    totalRevenue - reservedPayoutAmount,
    0
  )

  return {
    availableBalance: availablePayoutBalance,
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
      })
    ),
    reservedAmount: reservedPayoutAmount,
    totalRevenue,
  } satisfies InstructorPayoutListResponse
}

async function assertInstructorOwnsCourse(
  courseId: string,
  instructorId: string
) {
  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(eq(courses.id, courseId), eq(courses.instructorId, instructorId))
    )
    .limit(1)

  if (!course) {
    throw new HttpError(404, "Course not found.")
  }
}

instructorDashboardRouter.use(requireAuth, requireRole(["admin", "instructor"]))

instructorDashboardRouter.get(
  "/overview",
  asyncHandler(async (request, response) => {
    const analytics = await loadInstructorAnalytics(request.auth!.profile.id)

    if (request.auth!.profile.role === "instructor") {
      response.status(200).json({
        courses: analytics.courses.map(({ revenue, ...course }) => {
          void revenue
          return course
        }),
        totals: (() => {
          const { revenue, ...totals } = analytics.totals
          void revenue
          return totals
        })(),
      })
      return
    }

    response.status(200).json({
      courses: analytics.courses,
      totals: analytics.totals,
    } satisfies InstructorAnalyticsOverviewResponse)
  })
)

instructorDashboardRouter.get(
  "/courses/:courseId/students",
  asyncHandler(async (request, response) => {
    const params = courseParamsSchema.parse(request.params)
    const instructorId = request.auth!.profile.id

    await assertInstructorOwnsCourse(params.courseId, instructorId)

    const [courseRow] = await db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
      })
      .from(courses)
      .where(eq(courses.id, params.courseId))
      .limit(1)

    if (!courseRow) {
      throw new HttpError(404, "Course not found.")
    }

    const lectureRows = await db
      .select({
        lectureId: videos.id,
      })
      .from(videos)
      .innerJoin(modules, eq(videos.moduleId, modules.id))
      .innerJoin(sections, eq(modules.milestoneId, sections.id))
      .where(
        and(
          eq(sections.courseId, params.courseId),
          eq(videos.isPublished, true)
        )
      )

    const lectureIds = lectureRows.map((row) => row.lectureId)

    const enrollmentRows = await db
      .select({
        enrolledAt: enrollments.enrolledAt,
        enrollmentId: enrollments.id,
        email: users.email,
        fullName: profiles.fullName,
        revokedAt: enrollments.revokedAt,
        status: enrollments.status,
        userId: enrollments.userId,
      })
      .from(enrollments)
      .innerJoin(profiles, eq(enrollments.userId, profiles.id))
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(enrollments.courseId, params.courseId))
      .orderBy(desc(enrollments.enrolledAt))

    const studentIds = enrollmentRows.map((row) => row.userId)
    const progressRows =
      lectureIds.length > 0 && studentIds.length > 0
        ? await db
            .select({
              completedAt: videoProgress.completedAt,
              isCompleted: videoProgress.isCompleted,
              lastWatchedAt: videoProgress.lastWatchedAt,
              lectureId: videoProgress.videoId,
              userId: videoProgress.userId,
            })
            .from(videoProgress)
            .where(
              and(
                inArray(videoProgress.userId, studentIds),
                inArray(videoProgress.videoId, lectureIds)
              )
            )
        : []

    const progressByUserLecture = new Map<
      string,
      {
        completedAt: Date | null
        isCompleted: boolean
        lastWatchedAt: Date
      }
    >()

    for (const row of progressRows) {
      progressByUserLecture.set(`${row.userId}:${row.lectureId}`, {
        completedAt: row.completedAt,
        isCompleted: row.isCompleted,
        lastWatchedAt: row.lastWatchedAt,
      })
    }

    const revenueRows = await db.execute<{
      orders_count: number
      revenue: string
    }>(sql`
      select
        count(*)::int as orders_count,
        coalesce(sum(amount), 0)::text as revenue
      from orders
      where course_id = ${params.courseId}
        and status = 'paid'
    `)
    const revenueRow = revenueRows[0] ?? { orders_count: 0, revenue: "0" }

    const activeEnrollmentCount = enrollmentRows.filter(
      (row) => row.status === "active"
    ).length
    const completedEnrollmentCount = enrollmentRows.filter((row) => {
      if (row.status !== "active" || lectureIds.length === 0) {
        return false
      }

      return lectureIds.every(
        (lectureId) =>
          progressByUserLecture.get(`${row.userId}:${lectureId}`)?.isCompleted
      )
    }).length

    const students = enrollmentRows.map((row) => {
      const completedLectureCount = lectureIds.filter(
        (lectureId) =>
          progressByUserLecture.get(`${row.userId}:${lectureId}`)?.isCompleted
      ).length
      const progressSnapshots = lectureIds
        .map((lectureId) =>
          progressByUserLecture.get(`${row.userId}:${lectureId}`)
        )
        .filter((value): value is NonNullable<typeof value> => Boolean(value))

      const lastWatchedAt = progressSnapshots.reduce<Date | null>(
        (current, value) => {
          if (!current) {
            return value.lastWatchedAt
          }

          return value.lastWatchedAt > current ? value.lastWatchedAt : current
        },
        null
      )

      const completedAt = progressSnapshots.reduce<Date | null>(
        (current, value) => {
          if (!value.isCompleted || !value.completedAt) {
            return current
          }

          if (!current) {
            return value.completedAt
          }

          return value.completedAt > current ? value.completedAt : current
        },
        null
      )

      const isCompleted =
        lectureIds.length > 0 && completedLectureCount === lectureIds.length

      return {
        completedAt: serializeDate(isCompleted ? completedAt : null),
        completionRate:
          lectureIds.length === 0
            ? 0
            : Math.round((completedLectureCount / lectureIds.length) * 100),
        completedLectureCount,
        email: row.email,
        enrolledAt: row.enrolledAt.toISOString(),
        enrollmentId: row.enrollmentId,
        enrollmentStatus: row.status,
        fullName: row.fullName,
        isCompleted,
        lastWatchedAt: serializeDate(lastWatchedAt),
        revokedAt: serializeDate(row.revokedAt),
        totalLectureCount: lectureIds.length,
        userId: row.userId,
      }
    })

    const payload: InstructorCourseStudentsResponse = {
      course: {
        id: courseRow.id,
        slug: courseRow.slug,
        title: courseRow.title,
      },
      metrics: {
        activeEnrollmentCount,
        completionRate:
          activeEnrollmentCount === 0
            ? 0
            : Math.round(
                (completedEnrollmentCount / activeEnrollmentCount) * 100
              ),
        completedEnrollmentCount,
        enrollmentCount: enrollmentRows.length,
        revenue:
          request.auth!.profile.role === "admin"
            ? toNumber(revenueRow.revenue)
            : 0,
        totalLectureCount: lectureIds.length,
      },
      students,
    }

    response.status(200).json(payload)
  })
)

instructorDashboardRouter.get(
  "/notifications",
  asyncHandler(async (request, response) => {
    const rows = await db
      .select({
        body: notifications.body,
        createdAt: notifications.createdAt,
        href: notifications.href,
        id: notifications.id,
        readAt: notifications.readAt,
        title: notifications.title,
        type: notifications.type,
      })
      .from(notifications)
      .where(eq(notifications.profileId, request.auth!.profile.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50)

    response.json({
      notifications: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        readAt: row.readAt?.toISOString() ?? null,
      })),
      unreadCount: rows.filter((row) => !row.readAt).length,
    })
  })
)

instructorDashboardRouter.post(
  "/notifications/:notificationId/read",
  asyncHandler(async (request, response) => {
    const notificationId = z
      .string()
      .uuid()
      .parse(request.params.notificationId)
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.profileId, request.auth!.profile.id)
        )
      )
    response.status(204).send()
  })
)

instructorDashboardRouter.get(
  "/courses/:courseId/quiz-results",
  asyncHandler(async (request, response) => {
    const { courseId } = courseParamsSchema.parse(request.params)
    await assertInstructorOwnsCourse(courseId, request.auth!.profile.id)
    const rows = await db
      .select({
        attemptId: quizAttempts.id,
        completedAt: quizAttempts.completedAt,
        courseId: courses.id,
        courseTitle: courses.title,
        quizId: quizzes.id,
        quizTitle: quizzes.title,
        score: quizAttempts.score,
        studentId: profiles.id,
        studentName: profiles.fullName,
        studentEmail: users.email,
        totalQuestions: quizAttempts.totalQuestions,
      })
      .from(quizAttempts)
      .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .innerJoin(courses, eq(quizzes.courseId, courses.id))
      .innerJoin(profiles, eq(quizAttempts.userId, profiles.id))
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(quizzes.courseId, courseId))
      .orderBy(desc(quizAttempts.completedAt))

    response.json({
      results: rows.map((row) => ({
        ...row,
        completedAt: row.completedAt.toISOString(),
        percentage: row.totalQuestions
          ? Math.round((row.score / row.totalQuestions) * 100)
          : 0,
      })),
    } satisfies InstructorQuizResultsResponse)
  })
)

instructorDashboardRouter.get(
  "/courses/:courseId/discussions",
  asyncHandler(async (request, response) => {
    const { courseId } = courseParamsSchema.parse(request.params)
    await assertInstructorOwnsCourse(courseId, request.auth!.profile.id)
    const rows = await db
      .select({
        authorId: profiles.id,
        authorName: profiles.fullName,
        authorRole: profiles.role,
        body: discussionPosts.body,
        courseId: discussionPosts.courseId,
        createdAt: discussionPosts.createdAt,
        id: discussionPosts.id,
        lectureId: discussionPosts.lectureId,
        parentId: discussionPosts.parentId,
      })
      .from(discussionPosts)
      .innerJoin(profiles, eq(discussionPosts.authorId, profiles.id))
      .where(eq(discussionPosts.courseId, courseId))
      .orderBy(desc(discussionPosts.createdAt))
    response.json({
      posts: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
    } satisfies DiscussionListResponse)
  })
)

instructorDashboardRouter.post(
  "/courses/:courseId/discussions",
  asyncHandler(async (request, response) => {
    const { courseId } = courseParamsSchema.parse(request.params)
    const input = discussionCreateSchema.parse(request.body)
    await assertInstructorOwnsCourse(courseId, request.auth!.profile.id)
    const [post] = await db
      .insert(discussionPosts)
      .values({
        authorId: request.auth!.profile.id,
        body: input.body,
        courseId,
        lectureId: input.lectureId ?? null,
        parentId: input.parentId ?? null,
      })
      .returning({ id: discussionPosts.id })
    if (input.parentId) {
      const [parent] = await db
        .select({ authorId: discussionPosts.authorId })
        .from(discussionPosts)
        .where(eq(discussionPosts.id, input.parentId))
        .limit(1)
      if (parent && parent.authorId !== request.auth!.profile.id) {
        await createNotification({
          body: input.body,
          href: `/learn/${courseId}`,
          profileId: parent.authorId,
          title: "Your discussion received a reply",
          type: "discussion_reply",
        })
      }
    }
    response.status(201).json({ id: post!.id })
  })
)

instructorDashboardRouter.post(
  "/courses/:courseId/announcements",
  asyncHandler(async (request, response) => {
    const { courseId } = courseParamsSchema.parse(request.params)
    const input = announcementCreateSchema.parse(request.body)
    await assertInstructorOwnsCourse(courseId, request.auth!.profile.id)
    const [course] = await db
      .select({ title: courses.title })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)
    const [announcement] = await db
      .insert(announcements)
      .values({
        body: input.body,
        courseId,
        instructorId: request.auth!.profile.id,
        title: input.title,
      })
      .returning({ id: announcements.id, createdAt: announcements.createdAt })
    const students = await db
      .select({ profileId: enrollments.userId })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.status, "active")
        )
      )
    if (students.length) {
      await db.insert(notifications).values(
        students.map((student) => ({
          body: input.body,
          href: `/learn/${courseId}`,
          profileId: student.profileId,
          title: `${course?.title ?? "Course"}: ${input.title}`,
          type: "course_announcement",
        }))
      )
    }
    response.status(201).json({
      announcements: [
        {
          body: input.body,
          courseId,
          courseTitle: course?.title ?? "Course",
          createdAt: announcement!.createdAt.toISOString(),
          id: announcement!.id,
          title: input.title,
        },
      ],
    } satisfies AnnouncementListResponse)
  })
)

instructorDashboardRouter.get(
  "/payouts",
  asyncHandler(async (request, response) => {
    if (request.auth!.profile.role === "instructor") {
      throw new HttpError(403, "Instructor payout access is disabled.")
    }
    const payload = await loadInstructorPayoutList(request.auth!.profile.id)

    response.status(200).json(payload)
  })
)

instructorDashboardRouter.post(
  "/payouts",
  asyncHandler(async (request, response) => {
    if (request.auth!.profile.role === "instructor") {
      throw new HttpError(403, "Instructor payout access is disabled.")
    }
    const input = payoutCreateSchema.parse(request.body)
    const instructorId = request.auth!.profile.id
    const current = await loadInstructorPayoutList(instructorId)

    if (input.amount > current.availableBalance) {
      throw new HttpError(
        400,
        "Requested payout exceeds your available balance."
      )
    }

    const [created] = await db
      .insert(payoutRequests)
      .values({
        amount: input.amount.toFixed(2),
        currency: input.currency.toUpperCase(),
        instructorId,
        note: input.note ?? null,
        referenceCode: createReferenceCode("PAYOUT"),
        status: "pending",
      })
      .returning({ id: payoutRequests.id })

    if (!created) {
      throw new HttpError(500, "Payout request could not be created.")
    }

    const refreshed = await loadInstructorPayoutList(instructorId)

    response.status(201).json(refreshed)
  })
)
