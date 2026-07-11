import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type {
  InstructorCourseDto,
  InstructorCourseListResponse,
  InstructorCourseOutlineResponse,
  InstructorLectureDto,
  InstructorSectionDto,
} from "@workspace/types"
import { courseLevels, courseStatuses, videoProviders } from "@workspace/types"
import { and, asc, courses, desc, eq, lectures, sections } from "@workspace/db"

import { asyncHandler, HttpError } from "../http/errors.js"
import { db } from "../lib/database.js"
import { requireAuth, requireRole } from "../middleware/auth.js"

export const instructorCoursesRouter: ExpressRouter = Router()

const courseMutationSchema = z.object({
  category: z.string().trim().min(1).max(120).nullable().optional(),
  currency: z.string().trim().length(3).default("BDT"),
  description: z.string().trim().nullable().optional(),
  level: z.enum(courseLevels).default("all_levels"),
  price: z.coerce.number().nonnegative().default(0),
  shortDescription: z.string().trim().nullable().optional(),
  slug: z.string().trim().min(3).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.enum(courseStatuses).default("draft"),
  thumbnailUrl: z.string().trim().url().nullable().optional(),
  title: z.string().trim().min(3),
})

const coursePatchSchema = courseMutationSchema.partial()
const courseIdParamsSchema = z.object({
  id: z.string().uuid(),
})
const sectionIdParamsSchema = courseIdParamsSchema.extend({
  sectionId: z.string().uuid(),
})
const lectureIdParamsSchema = courseIdParamsSchema.extend({
  lectureId: z.string().uuid(),
})
const sectionMutationSchema = z.object({
  description: z.string().trim().nullable().optional(),
  dripAfterDays: z.coerce.number().int().nonnegative().default(0),
  position: z.coerce.number().int().nonnegative(),
  title: z.string().trim().min(1),
})
const sectionPatchSchema = sectionMutationSchema.partial()
const lectureMutationSchema = z.object({
  availableAt: z.coerce.date().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  durationSeconds: z.coerce.number().int().nonnegative().nullable().optional(),
  isPreview: z.coerce.boolean().default(false),
  isPublished: z.coerce.boolean().default(false),
  position: z.coerce.number().int().nonnegative(),
  title: z.string().trim().min(1),
  videoProvider: z.enum(videoProviders).default("r2"),
  videoRef: z.string().trim().nullable().optional(),
})
const lecturePatchSchema = lectureMutationSchema.partial()

function serializeDate(value: Date | null) {
  return value ? value.toISOString() : null
}

function toInstructorCourseDto(course: typeof courses.$inferSelect): InstructorCourseDto {
  return {
    category: course.category,
    createdAt: course.createdAt.toISOString(),
    currency: course.currency,
    description: course.description,
    id: course.id,
    level: course.level,
    price: course.price,
    publishedAt: serializeDate(course.publishedAt),
    shortDescription: course.shortDescription,
    slug: course.slug,
    status: course.status,
    thumbnailUrl: course.thumbnailUrl,
    title: course.title,
    updatedAt: course.updatedAt.toISOString(),
  }
}

function toInstructorLectureDto(
  lecture: typeof lectures.$inferSelect,
): InstructorLectureDto {
  return {
    availableAt: serializeDate(lecture.availableAt),
    createdAt: lecture.createdAt.toISOString(),
    description: lecture.description,
    durationSeconds: lecture.durationSeconds,
    id: lecture.id,
    isPreview: lecture.isPreview,
    isPublished: lecture.isPublished,
    position: lecture.position,
    sectionId: lecture.sectionId,
    title: lecture.title,
    updatedAt: lecture.updatedAt.toISOString(),
    videoProvider: lecture.videoProvider,
    videoRef: lecture.videoRef,
  }
}

function toInstructorSectionDto(
  section: typeof sections.$inferSelect,
  sectionLectures: Array<typeof lectures.$inferSelect>,
): InstructorSectionDto {
  return {
    courseId: section.courseId,
    createdAt: section.createdAt.toISOString(),
    description: section.description,
    dripAfterDays: section.dripAfterDays,
    id: section.id,
    lectures: sectionLectures.map(toInstructorLectureDto),
    position: section.position,
    title: section.title,
    updatedAt: section.updatedAt.toISOString(),
  }
}

function getPublishedAtForStatus(status: (typeof courseStatuses)[number] | undefined) {
  return status === "published" ? new Date() : null
}

async function assertInstructorOwnsCourse(courseId: string, instructorId: string) {
  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.instructorId, instructorId)))
    .limit(1)

  if (!course) {
    throw new HttpError(404, "Course not found.")
  }
}

async function assertSectionBelongsToCourse(sectionId: string, courseId: string) {
  const [section] = await db
    .select({ id: sections.id })
    .from(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.courseId, courseId)))
    .limit(1)

  if (!section) {
    throw new HttpError(404, "Section not found.")
  }
}

async function assertLectureBelongsToCourse(lectureId: string, courseId: string) {
  const [lecture] = await db
    .select({ id: lectures.id })
    .from(lectures)
    .innerJoin(sections, eq(lectures.sectionId, sections.id))
    .where(and(eq(lectures.id, lectureId), eq(sections.courseId, courseId)))
    .limit(1)

  if (!lecture) {
    throw new HttpError(404, "Lecture not found.")
  }
}

instructorCoursesRouter.use(requireAuth, requireRole(["admin", "instructor"]))

instructorCoursesRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const instructorId = request.auth!.profile!.id

    const rows = await db
      .select()
      .from(courses)
      .where(eq(courses.instructorId, instructorId))
      .orderBy(desc(courses.updatedAt))

    const payload: InstructorCourseListResponse = {
      courses: rows.map(toInstructorCourseDto),
    }

    response.status(200).json(payload)
  }),
)

instructorCoursesRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const input = courseMutationSchema.parse(request.body)
    const instructorId = request.auth!.profile!.id

    const [created] = await db
      .insert(courses)
      .values({
        ...input,
        instructorId,
        price: String(input.price),
        publishedAt: getPublishedAtForStatus(input.status),
      })
      .returning()

    if (!created) {
      throw new HttpError(500, "Course could not be created.")
    }

    response.status(201).json(toInstructorCourseDto(created))
  }),
)

instructorCoursesRouter.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.parse(request.params)
    const instructorId = request.auth!.profile!.id

    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, params.id), eq(courses.instructorId, instructorId)))
      .limit(1)

    if (!course) {
      throw new HttpError(404, "Course not found.")
    }

    response.status(200).json(toInstructorCourseDto(course))
  }),
)

instructorCoursesRouter.get(
  "/:id/outline",
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.parse(request.params)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)

    const sectionRows = await db
      .select()
      .from(sections)
      .where(eq(sections.courseId, params.id))
      .orderBy(asc(sections.position))

    const lectureRows = await db
      .select()
      .from(lectures)
      .innerJoin(sections, eq(lectures.sectionId, sections.id))
      .where(eq(sections.courseId, params.id))
      .orderBy(asc(sections.position), asc(lectures.position))

    const sectionEntities = sectionRows.map((section) =>
      toInstructorSectionDto(
        section,
        lectureRows
          .filter((row) => row.lectures.sectionId === section.id)
          .map((row) => row.lectures),
      ),
    )
    const payload: InstructorCourseOutlineResponse = {
      sections: sectionEntities,
    }

    response.status(200).json(payload)
  }),
)

instructorCoursesRouter.post(
  "/:id/sections",
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.parse(request.params)
    const input = sectionMutationSchema.parse(request.body)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)

    const [created] = await db
      .insert(sections)
      .values({
        ...input,
        courseId: params.id,
      })
      .returning()

    if (!created) {
      throw new HttpError(500, "Section could not be created.")
    }

    response.status(201).json(toInstructorSectionDto(created, []))
  }),
)

instructorCoursesRouter.patch(
  "/:id/sections/:sectionId",
  asyncHandler(async (request, response) => {
    const params = sectionIdParamsSchema.parse(request.params)
    const input = sectionPatchSchema.parse(request.body)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)

    const [updated] = await db
      .update(sections)
      .set(input)
      .where(and(eq(sections.id, params.sectionId), eq(sections.courseId, params.id)))
      .returning()

    if (!updated) {
      throw new HttpError(404, "Section not found.")
    }

    response.status(200).json(toInstructorSectionDto(updated, []))
  }),
)

instructorCoursesRouter.delete(
  "/:id/sections/:sectionId",
  asyncHandler(async (request, response) => {
    const params = sectionIdParamsSchema.parse(request.params)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)

    const [deleted] = await db
      .delete(sections)
      .where(and(eq(sections.id, params.sectionId), eq(sections.courseId, params.id)))
      .returning({ id: sections.id })

    if (!deleted) {
      throw new HttpError(404, "Section not found.")
    }

    response.status(204).send()
  }),
)

instructorCoursesRouter.post(
  "/:id/sections/:sectionId/lectures",
  asyncHandler(async (request, response) => {
    const params = sectionIdParamsSchema.parse(request.params)
    const input = lectureMutationSchema.parse(request.body)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)
    await assertSectionBelongsToCourse(params.sectionId, params.id)

    const [created] = await db
      .insert(lectures)
      .values({
        ...input,
        availableAt: input.availableAt ?? null,
        sectionId: params.sectionId,
      })
      .returning()

    if (!created) {
      throw new HttpError(500, "Lecture could not be created.")
    }

    response.status(201).json(toInstructorLectureDto(created))
  }),
)

instructorCoursesRouter.patch(
  "/:id/lectures/:lectureId",
  asyncHandler(async (request, response) => {
    const params = lectureIdParamsSchema.parse(request.params)
    const input = lecturePatchSchema.parse(request.body)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)

    const [updated] = await db
      .update(lectures)
      .set(input)
      .from(sections)
      .where(
        and(
          eq(lectures.id, params.lectureId),
          eq(lectures.sectionId, sections.id),
          eq(sections.courseId, params.id),
        ),
      )
      .returning()

    if (!updated) {
      throw new HttpError(404, "Lecture not found.")
    }

    response.status(200).json(toInstructorLectureDto(updated))
  }),
)

instructorCoursesRouter.delete(
  "/:id/lectures/:lectureId",
  asyncHandler(async (request, response) => {
    const params = lectureIdParamsSchema.parse(request.params)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)
    await assertLectureBelongsToCourse(params.lectureId, params.id)

    const [deleted] = await db
      .delete(lectures)
      .where(eq(lectures.id, params.lectureId))
      .returning({ id: lectures.id })

    if (!deleted) {
      throw new HttpError(404, "Lecture not found.")
    }

    response.status(204).send()
  }),
)

instructorCoursesRouter.patch(
  "/:id",
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.parse(request.params)
    const input = coursePatchSchema.parse(request.body)
    const instructorId = request.auth!.profile!.id
    const publishedAt =
      input.status === undefined ? undefined : getPublishedAtForStatus(input.status)

    const [updated] = await db
      .update(courses)
      .set({
        ...input,
        price: input.price === undefined ? undefined : String(input.price),
        publishedAt,
      })
      .where(and(eq(courses.id, params.id), eq(courses.instructorId, instructorId)))
      .returning()

    if (!updated) {
      throw new HttpError(404, "Course not found.")
    }

    response.status(200).json(toInstructorCourseDto(updated))
  }),
)

instructorCoursesRouter.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.parse(request.params)
    const instructorId = request.auth!.profile!.id

    const [deleted] = await db
      .delete(courses)
      .where(and(eq(courses.id, params.id), eq(courses.instructorId, instructorId)))
      .returning({ id: courses.id })

    if (!deleted) {
      throw new HttpError(404, "Course not found.")
    }

    response.status(204).send()
  }),
)
