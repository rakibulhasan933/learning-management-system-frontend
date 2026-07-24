import {
  and,
  courses,
  enrollments,
  eq,
  lectures,
  progress,
  sections,
} from "@workspace/db"
import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type {
  LectureProgressDto,
  LectureProgressMutationResponse,
} from "@workspace/types"

import { asyncHandler, HttpError } from "../http/errors.js"
import { db } from "../lib/database.js"
import { requireAuth, requireRole } from "../middleware/auth.js"

export const progressRouter: ExpressRouter = Router()

const lectureParamsSchema = z.object({
  lectureId: z.string().uuid(),
})
const progressMutationSchema = z.object({
  isCompleted: z.coerce.boolean().optional(),
  positionSeconds: z.coerce.number().int().nonnegative(),
})

function serializeDate(value: Date | null) {
  return value ? value.toISOString() : null
}

function toProgressDto(row: typeof progress.$inferSelect): LectureProgressDto {
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

async function assertCanTrackLecture(lectureId: string, profileId: string) {
  const [lecture] = await db
    .select({
      courseId: courses.id,
      id: lectures.id,
      isPublished: lectures.isPublished,
    })
    .from(lectures)
    .innerJoin(sections, eq(lectures.sectionId, sections.id))
    .innerJoin(courses, eq(sections.courseId, courses.id))
    .where(eq(lectures.id, lectureId))
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
        eq(enrollments.userId, profileId),
        eq(enrollments.status, "active"),
      ),
    )
    .limit(1)

  if (!enrollment) {
    throw new HttpError(403, "Active enrollment is required.")
  }
}

progressRouter.use(requireAuth, requireRole(["admin", "student"]))

progressRouter.put(
  "/lectures/:lectureId",
  asyncHandler(async (request, response) => {
    const params = lectureParamsSchema.parse(request.params)
    const input = progressMutationSchema.parse(request.body)
    const profileId = request.auth!.profile.id

    await assertCanTrackLecture(params.lectureId, profileId)

    const now = new Date()
    const shouldComplete = input.isCompleted === true
    const [saved] = await db
      .insert(progress)
      .values({
        completedAt: shouldComplete ? now : null,
        isCompleted: shouldComplete,
        lastWatchedAt: now,
        lectureId: params.lectureId,
        positionSeconds: input.positionSeconds,
        updatedAt: now,
        userId: profileId,
      })
      .onConflictDoUpdate({
        set: {
          ...(shouldComplete
            ? {
                completedAt: now,
                isCompleted: true,
              }
            : {}),
          lastWatchedAt: now,
          positionSeconds: input.positionSeconds,
          updatedAt: now,
        },
        target: [progress.userId, progress.lectureId],
      })
      .returning()

    if (!saved) {
      throw new HttpError(500, "Progress could not be saved.")
    }

    response.status(200).json({
      progress: toProgressDto(saved),
    } satisfies LectureProgressMutationResponse)
  }),
)
