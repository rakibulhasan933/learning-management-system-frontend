import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type {
  InstructorCourseDto,
  InstructorCourseListResponse,
  InstructorCourseOutlineResponse,
  InstructorLectureDto,
  InstructorQuizDto,
  InstructorSectionDto,
  InstructorVideoUploadUrlResponse,
} from "@workspace/types"
import { courseLevels, courseStatuses, videoProviders } from "@workspace/types"
import {
  and,
  asc,
  courses,
  desc,
  eq,
  lectures,
  quizOptions,
  quizQuestions,
  quizzes,
  sections,
} from "@workspace/db"

import { asyncHandler, HttpError } from "../http/errors.js"
import { db } from "../lib/database.js"
import {
  getInstructorQuizDtosForCourse,
  toInstructorQuizDto,
} from "../lib/quizzes.js"
import { createLectureVideoKey, createR2UploadUrl } from "../lib/r2.js"
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
const videoUploadUrlSchema = z.object({
  contentType: z.literal("video/mp4"),
  fileName: z.string().trim().min(1).max(255),
})
const quizOptionMutationSchema = z.object({
  isCorrect: z.coerce.boolean().default(false),
  optionText: z.string().trim().min(1).max(1000),
  position: z.coerce.number().int().nonnegative(),
})
const quizQuestionMutationSchema = z.object({
  options: z
    .array(quizOptionMutationSchema)
    .min(2)
    .refine((options) => options.some((option) => option.isCorrect), {
      message: "Each question needs at least one correct option.",
    }),
  position: z.coerce.number().int().nonnegative(),
  questionText: z.string().trim().min(1).max(2000),
})
const quizMutationSchema = z.object({
  isPublished: z.coerce.boolean().default(false),
  questions: z.array(quizQuestionMutationSchema).min(1),
  title: z.string().trim().min(1).max(255),
})
const quizIdParamsSchema = courseIdParamsSchema.extend({
  quizId: z.string().uuid(),
})

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
  quiz: InstructorQuizDto | null = null,
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
    quiz,
  }
}

function toInstructorSectionDto(
  section: typeof sections.$inferSelect,
  sectionLectures: Array<typeof lectures.$inferSelect>,
  quiz: InstructorQuizDto | null = null,
  lectureQuizzes: InstructorQuizDto[] = [],
): InstructorSectionDto {
  return {
    courseId: section.courseId,
    createdAt: section.createdAt.toISOString(),
    description: section.description,
    dripAfterDays: section.dripAfterDays,
    id: section.id,
    lectures: sectionLectures.map((lecture) =>
      toInstructorLectureDto(
        lecture,
        lectureQuizzes.find((lectureQuiz) => lectureQuiz.lectureId === lecture.id) ??
          null,
      ),
    ),
    position: section.position,
    quiz,
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

async function saveQuizForTarget({
  courseId,
  input,
  lectureId,
  sectionId,
}: {
  courseId: string
  input: z.infer<typeof quizMutationSchema>
  lectureId?: string
  sectionId?: string
}) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(quizzes)
      .where(
        lectureId
          ? eq(quizzes.lectureId, lectureId)
          : eq(quizzes.sectionId, sectionId!),
      )
      .limit(1)
    const [quiz] =
      existing.length > 0
        ? await tx
            .update(quizzes)
            .set({
              isPublished: input.isPublished,
              title: input.title,
            })
            .where(eq(quizzes.id, existing[0]!.id))
            .returning()
        : await tx
            .insert(quizzes)
            .values({
              courseId,
              isPublished: input.isPublished,
              lectureId: lectureId ?? null,
              sectionId: sectionId ?? null,
              title: input.title,
            })
            .returning()

    if (!quiz) {
      throw new HttpError(500, "Quiz could not be saved.")
    }

    await tx.delete(quizQuestions).where(eq(quizQuestions.quizId, quiz.id))

    const savedQuestions: Array<typeof quizQuestions.$inferSelect> = []
    const savedOptions: Array<typeof quizOptions.$inferSelect> = []

    for (const questionInput of input.questions) {
      const [question] = await tx
        .insert(quizQuestions)
        .values({
          position: questionInput.position,
          questionText: questionInput.questionText,
          quizId: quiz.id,
        })
        .returning()

      if (!question) {
        throw new HttpError(500, "Quiz question could not be saved.")
      }

      savedQuestions.push(question)

      const optionRows = await tx
        .insert(quizOptions)
        .values(
          questionInput.options.map((optionInput) => ({
            isCorrect: optionInput.isCorrect,
            optionText: optionInput.optionText,
            position: optionInput.position,
            questionId: question.id,
          })),
        )
        .returning()

      savedOptions.push(...optionRows)
    }

    return toInstructorQuizDto({
      options: savedOptions,
      questions: savedQuestions,
      quiz,
    })
  })
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
    const quizDtos = await getInstructorQuizDtosForCourse(params.id)

    const sectionEntities = sectionRows.map((section) =>
      toInstructorSectionDto(
        section,
        lectureRows
          .filter((row) => row.lectures.sectionId === section.id)
          .map((row) => row.lectures),
        quizDtos.find((quiz) => quiz.sectionId === section.id) ?? null,
        quizDtos.filter((quiz) => Boolean(quiz.lectureId)),
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

instructorCoursesRouter.put(
  "/:id/sections/:sectionId/quiz",
  asyncHandler(async (request, response) => {
    const params = sectionIdParamsSchema.parse(request.params)
    const input = quizMutationSchema.parse(request.body)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)
    await assertSectionBelongsToCourse(params.sectionId, params.id)

    const quiz = await saveQuizForTarget({
      courseId: params.id,
      input,
      sectionId: params.sectionId,
    })

    response.status(200).json(quiz)
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

instructorCoursesRouter.put(
  "/:id/lectures/:lectureId/quiz",
  asyncHandler(async (request, response) => {
    const params = lectureIdParamsSchema.parse(request.params)
    const input = quizMutationSchema.parse(request.body)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)
    await assertLectureBelongsToCourse(params.lectureId, params.id)

    const quiz = await saveQuizForTarget({
      courseId: params.id,
      input,
      lectureId: params.lectureId,
    })

    response.status(200).json(quiz)
  }),
)

instructorCoursesRouter.delete(
  "/:id/quizzes/:quizId",
  asyncHandler(async (request, response) => {
    const params = quizIdParamsSchema.parse(request.params)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)

    const [deleted] = await db
      .delete(quizzes)
      .where(and(eq(quizzes.id, params.quizId), eq(quizzes.courseId, params.id)))
      .returning({ id: quizzes.id })

    if (!deleted) {
      throw new HttpError(404, "Quiz not found.")
    }

    response.status(204).send()
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

instructorCoursesRouter.post(
  "/:id/lectures/:lectureId/video-upload-url",
  asyncHandler(async (request, response) => {
    const params = lectureIdParamsSchema.parse(request.params)
    const input = videoUploadUrlSchema.parse(request.body)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)
    await assertLectureBelongsToCourse(params.lectureId, params.id)

    const videoRef = createLectureVideoKey({
      courseId: params.id,
      fileName: input.fileName,
      lectureId: params.lectureId,
    })
    const uploadUrl = await createR2UploadUrl({
      contentType: input.contentType,
      key: videoRef,
    })
    const payload: InstructorVideoUploadUrlResponse = {
      expiresInSeconds: 15 * 60,
      headers: {
        "Content-Type": input.contentType,
      },
      uploadUrl,
      videoProvider: "r2",
      videoRef,
    }

    response.status(201).json(payload)
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
