import { and, courses, desc, discussionPosts, enrollments, eq, profiles } from "@workspace/db"
import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type { DiscussionListResponse } from "@workspace/types"

import { asyncHandler, HttpError } from "../http/errors.js"
import { db } from "../lib/database.js"
import { createNotification } from "../lib/notifications.js"
import { requireAuth, requireRole } from "../middleware/auth.js"

export const communityRouter: ExpressRouter = Router()
const paramsSchema = z.object({ courseId: z.string().uuid() })
const postSchema = z.object({ body: z.string().trim().min(2).max(5000), lectureId: z.string().uuid().nullable().optional(), parentId: z.string().uuid().nullable().optional() })

async function canAccessCourse(courseId: string, profileId: string, role: string) {
  if (role === "admin") return true
  const [course] = await db.select({ instructorId: courses.instructorId }).from(courses).where(eq(courses.id, courseId)).limit(1)
  if (course?.instructorId === profileId) return true
  const [enrollment] = await db.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.courseId, courseId), eq(enrollments.userId, profileId), eq(enrollments.status, "active"))).limit(1)
  return Boolean(enrollment)
}

communityRouter.use(requireAuth, requireRole(["admin", "instructor", "student"]))

communityRouter.get("/courses/:courseId/discussions", asyncHandler(async (request, response) => {
  const { courseId } = paramsSchema.parse(request.params)
  if (!(await canAccessCourse(courseId, request.auth!.profile.id, request.auth!.profile.role))) throw new HttpError(403, "Active enrollment is required.")
  const rows = await db.select({ authorId: profiles.id, authorName: profiles.fullName, authorRole: profiles.role, body: discussionPosts.body, courseId: discussionPosts.courseId, createdAt: discussionPosts.createdAt, id: discussionPosts.id, lectureId: discussionPosts.lectureId, parentId: discussionPosts.parentId }).from(discussionPosts).innerJoin(profiles, eq(discussionPosts.authorId, profiles.id)).where(eq(discussionPosts.courseId, courseId)).orderBy(desc(discussionPosts.createdAt))
  response.json({ posts: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })) } satisfies DiscussionListResponse)
}))

communityRouter.post("/courses/:courseId/discussions", asyncHandler(async (request, response) => {
  const { courseId } = paramsSchema.parse(request.params)
  const input = postSchema.parse(request.body)
  if (!(await canAccessCourse(courseId, request.auth!.profile.id, request.auth!.profile.role))) throw new HttpError(403, "Active enrollment is required.")
  const [post] = await db.insert(discussionPosts).values({ authorId: request.auth!.profile.id, body: input.body, courseId, lectureId: input.lectureId ?? null, parentId: input.parentId ?? null }).returning({ id: discussionPosts.id })
  const [course] = await db.select({ instructorId: courses.instructorId, title: courses.title }).from(courses).where(eq(courses.id, courseId)).limit(1)
  if (course && course.instructorId !== request.auth!.profile.id) {
    await createNotification({ body: input.body, href: `/dashboard/instructor/discussions`, profileId: course.instructorId, title: `New question in ${course.title}`, type: "discussion_question" })
  }
  if (input.parentId) {
    const [parent] = await db.select({ authorId: discussionPosts.authorId }).from(discussionPosts).where(eq(discussionPosts.id, input.parentId)).limit(1)
    if (parent && parent.authorId !== request.auth!.profile.id) {
      await createNotification({ body: input.body, href: `/learn/${courseId}`, profileId: parent.authorId, title: `New reply in ${course?.title ?? "your course discussion"}`, type: "discussion_reply" })
    }
  }
  response.status(201).json({ id: post!.id })
}))
