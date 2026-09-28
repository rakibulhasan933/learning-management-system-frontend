import {
  and,
  courses,
  enrollments,
  eq,
  lectures,
  modules,
  sections,
  videos,
} from "@workspace/db"
import { Router, type Request, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type { LectureVideoUrlResponse } from "@workspace/types"

import { asyncHandler, HttpError } from "../http/errors.js"
import { accessTokenCookieName, verifyAccessToken } from "../lib/auth-tokens.js"
import { db } from "../lib/database.js"
import { getProfileByUserId } from "../lib/profiles.js"
import { createR2PlaybackUrl } from "../lib/r2.js"

export const lecturesRouter: ExpressRouter = Router()

const lectureParamsSchema = z.object({
  id: z.string().uuid(),
})
const videoParamsSchema = lectureParamsSchema

function parseCookies(header: string | undefined) {
  return Object.fromEntries(
    (header ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=")

        if (separatorIndex === -1) {
          return [part, ""]
        }

        return [
          decodeURIComponent(part.slice(0, separatorIndex)),
          decodeURIComponent(part.slice(separatorIndex + 1)),
        ]
      })
  )
}

async function getOptionalProfileId(request: Request) {
  const authorization = request.get("authorization")
  const bearerMatch = authorization?.match(/^Bearer\s+(\S+)$/i)
  const token =
    bearerMatch?.[1] ??
    parseCookies(request.get("cookie"))[accessTokenCookieName] ??
    null

  if (!token) {
    return null
  }

  try {
    const payload = verifyAccessToken(token)
    const profile = await getProfileByUserId(payload.sub)

    return profile?.id ?? null
  } catch {
    return null
  }
}

lecturesRouter.get(
  "/:id/video-url",
  asyncHandler(async (request, response) => {
    const params = lectureParamsSchema.parse(request.params)
    const [lecture] = await db
      .select({
        courseId: courses.id,
        courseStatus: courses.status,
        isPreview: lectures.isPreview,
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

    const profileId = await getOptionalProfileId(request)
    const canUsePublicPreview =
      lecture.isPreview && lecture.courseStatus === "published"

    if (!canUsePublicPreview) {
      if (!profileId) {
        throw new HttpError(401, "Authentication is required.")
      }

      const [enrollment] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.courseId, lecture.courseId),
            eq(enrollments.userId, profileId),
            eq(enrollments.status, "active")
          )
        )
        .limit(1)

      if (!enrollment) {
        throw new HttpError(403, "Active enrollment is required.")
      }
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
  })
)

lecturesRouter.get(
  "/videos/:id/video-url",
  asyncHandler(async (request, response) => {
    const params = videoParamsSchema.parse(request.params)
    const [video] = await db
      .select({
        courseId: courses.id,
        courseStatus: courses.status,
        isPreview: videos.isPreview,
        isPublished: videos.isPublished,
        videoProvider: videos.videoProvider,
        videoRef: videos.videoRef,
      })
      .from(videos)
      .innerJoin(modules, eq(videos.moduleId, modules.id))
      .innerJoin(sections, eq(modules.milestoneId, sections.id))
      .innerJoin(courses, eq(sections.courseId, courses.id))
      .where(eq(videos.id, params.id))
      .limit(1)

    if (!video || !video.isPublished)
      throw new HttpError(404, "Video not found.")
    const profileId = await getOptionalProfileId(request)
    if (!(video.isPreview && video.courseStatus === "published")) {
      if (!profileId) throw new HttpError(401, "Authentication is required.")
      const [enrollment] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.courseId, video.courseId),
            eq(enrollments.userId, profileId),
            eq(enrollments.status, "active")
          )
        )
        .limit(1)
      if (!enrollment)
        throw new HttpError(403, "Active enrollment is required.")
    }
    if (!video.videoRef) throw new HttpError(404, "Video is not available.")
    if (video.videoProvider !== "r2")
      throw new HttpError(501, "Video provider is not supported yet.")
    response
      .status(200)
      .json({
        expiresInSeconds: 20 * 60,
        provider: video.videoProvider,
        url: await createR2PlaybackUrl(video.videoRef),
      })
  })
)
