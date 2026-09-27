import {
  and,
  asc,
  courses,
  enrollments,
  eq,
  modules,
  sections,
  videos,
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

    const moduleRows = await db
      .select({ contentTypes: modules.contentTypes, id: modules.id, milestoneId: modules.milestoneId, pdfUrl: modules.pdfUrl, position: modules.position, slidesUrl: modules.slidesUrl, title: modules.title })
      .from(modules)
      .innerJoin(sections, eq(modules.milestoneId, sections.id))
      .where(eq(sections.courseId, params.courseId))
      .orderBy(asc(sections.position), asc(modules.position))
    const videoRows = await db
      .select({
        availableAt: videos.availableAt,
        description: videos.description,
        durationSeconds: videos.durationSeconds,
        id: videos.id,
        isPreview: videos.isPreview,
        pdfUrl: videos.pdfUrl,
        position: videos.position,
        moduleId: videos.moduleId,
        slidesUrl: videos.slidesUrl,
        title: videos.title,
      })
      .from(videos)
      .innerJoin(modules, eq(videos.moduleId, modules.id))
      .innerJoin(sections, eq(modules.milestoneId, sections.id))
      .where(
        and(eq(sections.courseId, params.courseId), eq(videos.isPublished, true)),
      )
      .orderBy(asc(sections.position), asc(modules.position), asc(videos.position))
    const videoIds = videoRows.map((video) => video.id)
    const progressRows =
      videoIds.length === 0
        ? []
        : await db.query.videoProgress.findMany({
            where: (table, { and: andWhere, eq: eqWhere, inArray }) =>
              andWhere(
                eqWhere(table.userId, request.auth!.profile.id),
                inArray(table.videoId, videoIds),
              ),
          })
    const progressDtos = progressRows.map((row) => ({
      completedAt: serializeDate(row.completedAt),
      id: row.id,
      isCompleted: row.isCompleted,
      lastWatchedAt: row.lastWatchedAt.toISOString(),
      lectureId: row.videoId,
      positionSeconds: row.positionSeconds,
      updatedAt: row.updatedAt.toISOString(),
    }))
    const completedLectureCount = videoRows.filter((video) =>
      progressRows.some(
        (row) => row.videoId === video.id && row.isCompleted,
      ),
    ).length
    const totalLectureCount = videoRows.length
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
      sections: sectionRows.map((section) => {
        const sectionLectures = videoRows
          .filter((video) => moduleRows.some((module) => module.id === video.moduleId && module.milestoneId === section.id))
          .map((video) => {
      const module = moduleRows.find((item) => item.id === video.moduleId)
            const moduleVideos = videoRows.filter((item) => item.moduleId === video.moduleId)
            return {
              availableAt: serializeDate(video.availableAt),
              assignment: moduleVideos[0]?.id === video.id ? assignmentDtos.find((assignment) => assignment.moduleId === video.moduleId) ?? null : null,
              durationSeconds: video.durationSeconds,
              description: video.description,
              id: video.id,
              isPreview: video.isPreview,
              pdfUrl: video.pdfUrl,
              position: video.position,
              progress: progressDtos.find((item) => item.lectureId === video.id) ?? null,
              quiz: moduleVideos[0]?.id === video.id ? quizDtos.find((quiz) => quiz.moduleId === video.moduleId) ?? null : null,
              sectionId: module?.milestoneId ?? section.id,
              moduleId: video.moduleId,
              moduleTitle: module?.title ?? "Module",
              modulePdfUrl: module?.pdfUrl ?? null,
              moduleSlidesUrl: module?.slidesUrl ?? null,
              slidesUrl: video.slidesUrl,
              title: video.title,
            }
          })
        return {
          id: section.id,
          lectures: sectionLectures,
          modules: moduleRows
            .filter((module) => module.milestoneId === section.id)
            .map((module) => ({
              assignment: assignmentDtos.find((assignment) => assignment.moduleId === module.id) ?? null,
              contentTypes: module.contentTypes as Array<"video" | "pdf" | "quiz" | "assignment">,
              id: module.id,
              pdfUrl: module.pdfUrl,
              position: module.position,
              quiz: quizDtos.find((quiz) => quiz.moduleId === module.id) ?? null,
              slidesUrl: module.slidesUrl,
              title: module.title,
              videos: sectionLectures.filter((lecture) => lecture.moduleId === module.id),
            })),
          position: section.position,
          assignment: assignmentDtos.find((assignment) => assignment.sectionId === section.id) ?? null,
          quiz: quizDtos.find((quiz) => quiz.sectionId === section.id) ?? null,
          title: section.title,
        }
      }),
    }

    response.status(200).json(payload)
  }),
)
