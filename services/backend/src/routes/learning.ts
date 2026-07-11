import { and, asc, courses, enrollments, eq, lectures, sections } from "@workspace/db"
import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type { LearningCourseResponse } from "@workspace/types"

import { asyncHandler, HttpError } from "../http/errors.js"
import { db } from "../lib/database.js"
import { getStudentQuizzesForCourse } from "../lib/quizzes.js"
import { requireAuth, requireRole } from "../middleware/auth.js"

export const learningRouter: ExpressRouter = Router()

const courseParamsSchema = z.object({
  courseId: z.string().uuid(),
})

function serializeDate(value: Date | null) {
  return value ? value.toISOString() : null
}

learningRouter.get(
  "/courses/:courseId",
  requireAuth,
  requireRole(["student", "admin"]),
  asyncHandler(async (request, response) => {
    const params = courseParamsSchema.parse(request.params)
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, params.courseId),
          eq(enrollments.userId, request.auth!.profile.id),
          eq(enrollments.status, "active"),
        ),
      )
      .limit(1)

    if (!enrollment) {
      throw new HttpError(403, "Active enrollment is required.")
    }

    const [course] = await db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
      })
      .from(courses)
      .where(eq(courses.id, params.courseId))
      .limit(1)

    if (!course) {
      throw new HttpError(404, "Course not found.")
    }

    const sectionRows = await db
      .select({
        id: sections.id,
        position: sections.position,
        title: sections.title,
      })
      .from(sections)
      .where(eq(sections.courseId, params.courseId))
      .orderBy(asc(sections.position))

    const lectureRows = await db
      .select({
        availableAt: lectures.availableAt,
        durationSeconds: lectures.durationSeconds,
        id: lectures.id,
        isPreview: lectures.isPreview,
        position: lectures.position,
        sectionId: lectures.sectionId,
        title: lectures.title,
      })
      .from(lectures)
      .innerJoin(sections, eq(lectures.sectionId, sections.id))
      .where(
        and(eq(sections.courseId, params.courseId), eq(lectures.isPublished, true)),
      )
      .orderBy(asc(sections.position), asc(lectures.position))
    const quizDtos = await getStudentQuizzesForCourse(
      params.courseId,
      request.auth!.profile.id,
    )

    const payload: LearningCourseResponse = {
      course,
      learner: {
        email: request.auth!.profile.email,
      },
      sections: sectionRows.map((section) => ({
        id: section.id,
        lectures: lectureRows
          .filter((lecture) => lecture.sectionId === section.id)
          .map((lecture) => ({
            availableAt: serializeDate(lecture.availableAt),
            durationSeconds: lecture.durationSeconds,
            id: lecture.id,
            isPreview: lecture.isPreview,
            position: lecture.position,
            quiz:
              quizDtos.find((quiz) => quiz.lectureId === lecture.id) ?? null,
            sectionId: lecture.sectionId,
            title: lecture.title,
          })),
        position: section.position,
        quiz: quizDtos.find((quiz) => quiz.sectionId === section.id) ?? null,
        title: section.title,
      })),
    }

    response.status(200).json(payload)
  }),
)
