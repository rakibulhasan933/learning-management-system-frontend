import { and, courses, enrollments, eq, lectures, sections } from "@workspace/db"
import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type { LectureVideoUrlResponse } from "@workspace/types"

import { asyncHandler, HttpError } from "../http/errors.js"
import { db } from "../lib/database.js"
import { createR2PlaybackUrl } from "../lib/r2.js"
import { requireAuth } from "../middleware/auth.js"

export const lecturesRouter: ExpressRouter = Router()

const lectureParamsSchema = z.object({
  id: z.string().uuid(),
})

lecturesRouter.get(
  "/:id/video-url",
  requireAuth,
  asyncHandler(async (request, response) => {
    const params = lectureParamsSchema.parse(request.params)
    const [lecture] = await db
      .select({
        courseId: courses.id,
        isPublished: lectures.isPublished,
        videoProvider: lectures.videoProvider,
        videoRef: lectures.videoRef,
      })
      .from(lectures)
      .innerJoin(sections, eq(lectures.sectionId, sections.id))
      .innerJoin(courses, eq(sections.courseId, courses.id))
      .where(eq(lectures.id, params.id))
      .limit(1)

    if (!lecture || !lecture.isPublished) {
      throw new HttpError(404, "Lecture not found.")
    }

    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, lecture.courseId),
          eq(enrollments.userId, request.auth!.profile.id),
          eq(enrollments.status, "active"),
        ),
      )
      .limit(1)

    if (!enrollment) {
      throw new HttpError(403, "Active enrollment is required.")
    }

    if (!lecture.videoRef) {
      throw new HttpError(404, "Lecture video is not available.")
    }

    if (lecture.videoProvider !== "r2") {
      throw new HttpError(501, "Video provider is not supported yet.")
    }

    const payload: LectureVideoUrlResponse = {
      expiresInSeconds: 20 * 60,
      provider: lecture.videoProvider,
      url: await createR2PlaybackUrl(lecture.videoRef),
    }

    response.status(200).json(payload)
  }),
)
