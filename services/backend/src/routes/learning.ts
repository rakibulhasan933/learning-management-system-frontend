import {
  and,
  asc,
  courses,
  enrollments,
  eq,
  lectures,
  progress,
  sections,
} from "@workspace/db"
import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type { LearningCourseResponse } from "@workspace/types"

import { asyncHandler, HttpError } from "../http/errors.js"
import { db } from "../lib/database.js"
import { getStudentAssignmentsForCourse } from "../lib/assignments.js"
import { getStudentQuizzesForCourse } from "../lib/quizzes.js"
import { requireAuth, requireRole } from "../middleware/auth.js"

export const learningRouter: ExpressRouter = Router()

const courseParamsSchema = z.object({
  courseId: z.string().uuid(),
})

function serializeDate(value: Date | null) {
  return value ? value.toISOString() : null
}

function toProgressDto(row: typeof progress.$inferSelect) {
  return {
    completedAt: serializeDate(row.completedAt),
    id: row.id,
    isCompleted: row.isCompleted,
    lastWatchedAt: row.lastWatchedAt.toISOString(),
    lectureId: row.lectureId,
    positionSeconds: row.positionSeconds,
    updatedAt: row.updatedAt.toISOString(),
  }
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
        pdfUrl: lectures.pdfUrl,
        position: lectures.position,
        sectionId: lectures.sectionId,
        slidesUrl: lectures.slidesUrl,
        title: lectures.title,
      })
      .from(lectures)
      .innerJoin(sections, eq(lectures.sectionId, sections.id))
      .where(
        and(eq(sections.courseId, params.courseId), eq(lectures.isPublished, true)),
      )
      .orderBy(asc(sections.position), asc(lectures.position))
    const lectureIds = lectureRows.map((lecture) => lecture.id)
    const progressRows =
      lectureIds.length === 0
        ? []
        : await db.query.progress.findMany({
            where: (table, { and: andWhere, eq: eqWhere, inArray }) =>
              andWhere(
                eqWhere(table.userId, request.auth!.profile.id),
                inArray(table.lectureId, lectureIds),
              ),
          })
    const progressDtos = progressRows.map(toProgressDto)
    const completedLectureCount = lectureRows.filter((lecture) =>
      progressRows.some(
        (row) => row.lectureId === lecture.id && row.isCompleted,
      ),
    ).length
    const totalLectureCount = lectureRows.length
    const quizDtos = await getStudentQuizzesForCourse(
      params.courseId,
      request.auth!.profile.id,
    )
    const assignmentDtos = await getStudentAssignmentsForCourse(
      params.courseId,
      request.auth!.profile.id,
    )

    const payload: LearningCourseResponse = {
      course: {
        ...course,
        completedLectureCount,
        completionPercentage:
          totalLectureCount === 0
            ? 0
            : Math.round((completedLectureCount / totalLectureCount) * 100),
        totalLectureCount,
      },
      learner: {
        email: request.auth!.profile.email,
      },
      sections: sectionRows.map((section) => ({
        id: section.id,
        lectures: lectureRows
          .filter((lecture) => lecture.sectionId === section.id)
          .map((lecture) => ({
            availableAt: serializeDate(lecture.availableAt),
            assignment:
              assignmentDtos.find(
                (assignment) => assignment.lectureId === lecture.id,
              ) ?? null,
            durationSeconds: lecture.durationSeconds,
            id: lecture.id,
            isPreview: lecture.isPreview,
            pdfUrl: lecture.pdfUrl,
            position: lecture.position,
            progress:
              progressDtos.find((item) => item.lectureId === lecture.id) ?? null,
            quiz:
              quizDtos.find((quiz) => quiz.lectureId === lecture.id) ?? null,
            sectionId: lecture.sectionId,
            slidesUrl: lecture.slidesUrl,
            title: lecture.title,
          })),
        position: section.position,
        assignment:
          assignmentDtos.find((assignment) => assignment.sectionId === section.id) ??
          null,
        quiz: quizDtos.find((quiz) => quiz.sectionId === section.id) ?? null,
        title: section.title,
      })),
    }

    response.status(200).json(payload)
  }),
)
