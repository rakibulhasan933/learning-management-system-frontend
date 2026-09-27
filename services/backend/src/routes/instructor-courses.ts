import { raw, Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type {
  InstructorCourseDto,
  InstructorCourseListResponse,
  InstructorCourseOutlineResponse,
  InstructorAssignmentDto,
  InstructorLectureDto,
  InstructorLectureMaterialUploadResponse,
  InstructorQuizDto,
  InstructorSectionDto,
  InstructorVideoUploadUrlResponse,
} from "@workspace/types"
import { courseLevels, courseStatuses, videoProviders } from "@workspace/types"
import {
  and,
  assignmentSubmissions,
  asc,
  assignments,
  courses,
  desc,
  eq,
  lectures,
  modules,
  videos,
  quizOptions,
  quizQuestions,
  quizzes,
  sections,
  sql,
} from "@workspace/db"

import { asyncHandler, HttpError } from "../http/errors.js"
import { db } from "../lib/database.js"
import { createNotification } from "../lib/notifications.js"
import {
  getInstructorAssignmentDtosForCourse,
  gradeAssignmentSubmission,
  saveAssignmentForTarget,
} from "../lib/assignments.js"
import {
  getInstructorQuizDtosForCourse,
  toInstructorQuizDto,
} from "../lib/quizzes.js"
import {
  createLectureVideoKey,
  createR2UploadUrl,
  uploadLectureVideoToR2,
} from "../lib/r2.js"
import { uploadLectureMaterial } from "../lib/supabase-storage.js"
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
const moduleIdParamsSchema = courseIdParamsSchema.extend({
  moduleId: z.string().uuid(),
})
const moduleMutationSchema = z.object({
  contentTypes: z.array(z.enum(["video", "pdf", "quiz", "assignment"])).default([]),
  description: z.string().trim().nullable().optional(),
  position: z.coerce.number().int().nonnegative().optional(),
  title: z.string().trim().min(1),
})
const modulePatchSchema = z.object({
  contentTypes: z.array(z.enum(["video", "pdf", "quiz", "assignment"])).optional(),
  description: z.string().trim().nullable().optional(),
  title: z.string().trim().min(1).optional(),
})

type ModuleContentType = "video" | "pdf" | "quiz" | "assignment"

function requireModuleContentType(module: { contentTypes: string[] }, expected: ModuleContentType) {
  if (!module.contentTypes.includes(expected)) {
    throw new HttpError(409, `This module does not include ${expected} content.`)
  }
}
const videoMutationSchema = z.object({
  description: z.string().trim().nullable().optional(),
  durationSeconds: z.coerce.number().int().nonnegative().nullable().optional(),
  isPreview: z.coerce.boolean().default(false),
  isPublished: z.coerce.boolean().default(false),
  position: z.coerce.number().int().nonnegative(),
  title: z.string().trim().min(1),
  videoProvider: z.enum(videoProviders).default("r2"),
  videoRef: z.string().trim().nullable().optional(),
})
const videoPatchSchema = videoMutationSchema.partial()
const sectionMutationSchema = z.object({
  description: z.string().trim().nullable().optional(),
  dripAfterDays: z.coerce.number().int().nonnegative().default(0),
  position: z.coerce.number().int().nonnegative().optional(),
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
const videoUploadQuerySchema = z.object({
  fileName: z.string().trim().min(1).max(255),
})
const lectureMaterialUploadSchema = z.object({
  base64: z.string().min(1),
  contentType: z.string().trim().min(1).max(180),
  fileName: z.string().trim().min(1).max(255),
  kind: z.enum(["pdf", "slides"]),
})
const materialUploadQuerySchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  kind: z.enum(["pdf", "slides"]),
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
const assignmentIdParamsSchema = courseIdParamsSchema.extend({
  assignmentId: z.string().uuid(),
})
const assignmentSubmissionParamsSchema = courseIdParamsSchema.extend({
  submissionId: z.string().uuid(),
})
const assignmentMutationSchema = z.object({
  dueAt: z.coerce.date().nullable().optional(),
  instructions: z.string().trim().min(1).max(20_000),
  isPublished: z.coerce.boolean().default(false),
  maxScore: z.coerce.number().int().positive().default(100),
  title: z.string().trim().min(1).max(255),
})
const assignmentGradeSchema = z.object({
  gradeFeedback: z.string().trim().nullable().optional(),
  gradeScore: z.coerce.number().int().nonnegative(),
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
  assignment: InstructorAssignmentDto | null = null,
): InstructorLectureDto {
  return {
    assignment,
    availableAt: serializeDate(lecture.availableAt),
    createdAt: lecture.createdAt.toISOString(),
    description: lecture.description,
    durationSeconds: lecture.durationSeconds,
    id: lecture.id,
    isPreview: lecture.isPreview,
    isPublished: lecture.isPublished,
    pdfUrl: lecture.pdfUrl,
    position: lecture.position,
    sectionId: lecture.sectionId,
    slidesUrl: lecture.slidesUrl,
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
  assignment: InstructorAssignmentDto | null = null,
  lectureAssignments: InstructorAssignmentDto[] = [],
): InstructorSectionDto {
  return {
    assignment,
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
        lectureAssignments.find(
          (lectureAssignment) => lectureAssignment.lectureId === lecture.id,
        ) ?? null,
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
  moduleId,
  sectionId,
}: {
  courseId: string
  input: z.infer<typeof quizMutationSchema>
  lectureId?: string
  moduleId?: string
  sectionId?: string
}) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(quizzes)
      .where(
        lectureId
          ? eq(quizzes.lectureId, lectureId)
          : moduleId
            ? eq(quizzes.moduleId, moduleId)
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
              moduleId: moduleId ?? null,
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

instructorCoursesRouter.patch(
  "/:id/modules/:moduleId",
  asyncHandler(async (request, response) => {
    const params = moduleIdParamsSchema.parse(request.params)
    const input = modulePatchSchema.parse(request.body)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    const [module] = await db
      .select({ id: modules.id })
      .from(modules)
      .innerJoin(sections, eq(modules.milestoneId, sections.id))
      .where(and(eq(modules.id, params.moduleId), eq(sections.courseId, params.id)))
      .limit(1)
    if (!module) throw new HttpError(404, "Module not found.")
    const [updated] = await db.update(modules).set(input).where(eq(modules.id, params.moduleId)).returning()
    if (!updated) throw new HttpError(404, "Module not found.")
    response.status(200).json(updated)
  }),
)

instructorCoursesRouter.delete(
  "/:id/modules/:moduleId",
  asyncHandler(async (request, response) => {
    const params = moduleIdParamsSchema.parse(request.params)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    const [deleted] = await db
      .delete(modules)
      .where(
        and(
          eq(modules.id, params.moduleId),
          sql`${modules.milestoneId} in (select id from ${sections} where ${sections.courseId} = ${params.id})`,
        ),
      )
      .returning({ id: modules.id })
    if (!deleted) throw new HttpError(404, "Module not found.")
    response.status(204).send()
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

// New hierarchy endpoints. Legacy section/lecture handlers remain below while
// the instructor UI migrates to milestones, modules, and videos.
instructorCoursesRouter.get(
  "/:id/milestones",
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.parse(request.params)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)

    const milestoneRows = await db
      .select({ id: sections.id, title: sections.title, description: sections.description, position: sections.position })
      .from(sections)
      .where(eq(sections.courseId, params.id))
      .orderBy(asc(sections.position))
    const moduleQuizDtos = await getInstructorQuizDtosForCourse(params.id)
    const moduleAssignmentDtos = await getInstructorAssignmentDtosForCourse(params.id)
    response.status(200).json({
      milestones: await Promise.all(milestoneRows.map(async (milestone) => {
        const milestoneModules = await db.select().from(modules).where(eq(modules.milestoneId, milestone.id)).orderBy(asc(modules.position))
        return {
          ...milestone,
          modules: await Promise.all(milestoneModules.map(async (module) => ({
            ...module,
            videos: await db.select().from(videos).where(eq(videos.moduleId, module.id)).orderBy(asc(videos.position)),
            quiz: moduleQuizDtos.find((quiz) => quiz.moduleId === module.id) ?? null,
            assignment: moduleAssignmentDtos.find((assignment) => assignment.moduleId === module.id) ?? null,
          }))),
        }
      })),
    })
  }),
)

instructorCoursesRouter.post(
  "/:id/milestones/:milestoneId/modules",
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.extend({ milestoneId: z.string().uuid() }).parse(request.params)
    const input = moduleMutationSchema.parse(request.body)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    await assertSectionBelongsToCourse(params.milestoneId, params.id)
    const [lastModule] = await db
      .select({ position: sql<number>`coalesce(max(${modules.position}), -1)` })
      .from(modules)
      .where(eq(modules.milestoneId, params.milestoneId))
    const [created] = await db.insert(modules).values({ milestoneId: params.milestoneId, ...input, position: input.position ?? Number(lastModule?.position ?? -1) + 1 }).returning()
    response.status(201).json(created)
  }),
)

instructorCoursesRouter.post(
  "/:id/modules/:moduleId/videos",
  asyncHandler(async (request, response) => {
    const params = moduleIdParamsSchema.parse(request.params)
    const input = videoMutationSchema.parse(request.body)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    const [module] = await db.select({ id: modules.id, contentTypes: modules.contentTypes }).from(modules).innerJoin(sections, eq(modules.milestoneId, sections.id)).where(and(eq(modules.id, params.moduleId), eq(sections.courseId, params.id))).limit(1)
    if (!module) throw new HttpError(404, "Module not found.")
    requireModuleContentType(module, "video")
    const [created] = await db.insert(videos).values({ moduleId: params.moduleId, ...input }).returning()
    response.status(201).json(created)
  }),
)

instructorCoursesRouter.post(
  "/:id/modules/:moduleId/material",
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.extend({ moduleId: z.string().uuid() }).parse(request.params)
    const input = lectureMaterialUploadSchema.parse(request.body)
    if (input.kind !== "pdf") throw new HttpError(400, "Only PDF is supported as module material.")
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    const [module] = await db
      .select({ id: modules.id, contentTypes: modules.contentTypes })
      .from(modules)
      .innerJoin(sections, eq(modules.milestoneId, sections.id))
      .where(and(eq(modules.id, params.moduleId), eq(sections.courseId, params.id)))
      .limit(1)
    if (!module) throw new HttpError(404, "Module not found.")
    requireModuleContentType(module, "pdf")
    const url = await uploadLectureMaterial({
      base64: input.base64,
      contentType: input.contentType,
      courseId: params.id,
      fileName: input.fileName,
      kind: input.kind,
      lectureId: params.moduleId,
    })
    await db
      .update(modules)
      .set({ pdfUrl: url, slidesUrl: null })
      .where(eq(modules.id, params.moduleId))
    response.status(201).json({ url })
  }),
)

instructorCoursesRouter.post(
  "/:id/modules/:moduleId/material-upload",
  raw({ limit: "30mb", type: () => true }),
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.extend({ moduleId: z.string().uuid() }).parse(request.params)
    const query = materialUploadQuerySchema.parse(request.query)
    if (query.kind !== "pdf") throw new HttpError(400, "Only PDF is supported as module material.")
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    const [module] = await db.select({ id: modules.id, contentTypes: modules.contentTypes }).from(modules).innerJoin(sections, eq(modules.milestoneId, sections.id)).where(and(eq(modules.id, params.moduleId), eq(sections.courseId, params.id))).limit(1)
    if (!module) throw new HttpError(404, "Module not found.")
    requireModuleContentType(module, "pdf")
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) throw new HttpError(400, "Material file is required.")
    const contentType = request.get("content-type")?.split(";")[0] ?? "application/octet-stream"
    const url = await uploadLectureMaterial({ body: request.body, contentType, courseId: params.id, fileName: query.fileName, kind: query.kind, lectureId: params.moduleId })
    await db.update(modules).set({ pdfUrl: url, slidesUrl: null }).where(eq(modules.id, params.moduleId))
    response.status(201).json({ url })
  }),
)

instructorCoursesRouter.delete(
  "/:id/modules/:moduleId/material",
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.extend({ moduleId: z.string().uuid() }).parse(request.params)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    const [updated] = await db
      .update(modules)
      .set({ pdfUrl: null, slidesUrl: null })
      .where(
        and(
          eq(modules.id, params.moduleId),
          sql`${modules.milestoneId} in (select id from ${sections} where ${sections.courseId} = ${params.id})`,
        ),
      )
      .returning({ id: modules.id })
    if (!updated) throw new HttpError(404, "Module not found.")
    response.status(204).send()
  }),
)

instructorCoursesRouter.patch(
  "/:id/videos/:videoId",
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.extend({ videoId: z.string().uuid() }).parse(request.params)
    const input = videoPatchSchema.parse(request.body)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    const [video] = await db.select({ id: videos.id }).from(videos).innerJoin(modules, eq(videos.moduleId, modules.id)).innerJoin(sections, eq(modules.milestoneId, sections.id)).where(and(eq(videos.id, params.videoId), eq(sections.courseId, params.id))).limit(1)
    if (!video) throw new HttpError(404, "Video not found.")
    const [updated] = await db.update(videos).set(input).where(eq(videos.id, params.videoId)).returning()
    if (!updated) throw new HttpError(404, "Video not found.")
    response.status(200).json(updated)
  }),
)

instructorCoursesRouter.delete(
  "/:id/videos/:videoId",
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.extend({ videoId: z.string().uuid() }).parse(request.params)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    const [deleted] = await db
      .delete(videos)
      .where(
        and(
          eq(videos.id, params.videoId),
          sql`${videos.moduleId} in (select ${modules.id} from ${modules} inner join ${sections} on ${modules.milestoneId} = ${sections.id} where ${sections.courseId} = ${params.id})`,
        ),
      )
      .returning({ id: videos.id })
    if (!deleted) throw new HttpError(404, "Video not found.")
    response.status(204).send()
  }),
)

instructorCoursesRouter.post(
  "/:id/videos/:videoId/video-upload-url",
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.extend({ videoId: z.string().uuid() }).parse(request.params)
    const input = videoUploadUrlSchema.parse(request.body)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    const [video] = await db.select({ id: videos.id }).from(videos).innerJoin(modules, eq(videos.moduleId, modules.id)).innerJoin(sections, eq(modules.milestoneId, sections.id)).where(and(eq(videos.id, params.videoId), eq(sections.courseId, params.id))).limit(1)
    if (!video) throw new HttpError(404, "Video not found.")
    const videoRef = createLectureVideoKey({ courseId: params.id, fileName: input.fileName, lectureId: params.videoId })
    const uploadUrl = await createR2UploadUrl({ contentType: input.contentType, key: videoRef })
    response.status(201).json({ expiresInSeconds: 15 * 60, headers: { "Content-Type": input.contentType }, uploadUrl, videoProvider: "r2", videoRef })
  }),
)

instructorCoursesRouter.post(
  "/:id/videos/:videoId/video-upload",
  raw({ limit: "1024mb", type: "video/mp4" }),
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.extend({ videoId: z.string().uuid() }).parse(request.params)
    const query = videoUploadQuerySchema.parse(request.query)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    const [video] = await db.select({ id: videos.id }).from(videos).innerJoin(modules, eq(videos.moduleId, modules.id)).innerJoin(sections, eq(modules.milestoneId, sections.id)).where(and(eq(videos.id, params.videoId), eq(sections.courseId, params.id))).limit(1)
    if (!video) throw new HttpError(404, "Video not found.")
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) throw new HttpError(400, "Video file is required.")
    const videoRef = createLectureVideoKey({ courseId: params.id, fileName: query.fileName, lectureId: params.videoId })
    await uploadLectureVideoToR2({ body: request.body, contentType: "video/mp4", key: videoRef })
    await db.update(videos).set({ isPublished: true, title: query.fileName, videoProvider: "r2", videoRef }).where(eq(videos.id, params.videoId))
    response.status(201).json({ message: "Video uploaded and saved.", videoRef })
  }),
)

instructorCoursesRouter.post(
  "/:id/videos/:videoId/material",
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.extend({ videoId: z.string().uuid() }).parse(request.params)
    const input = lectureMaterialUploadSchema.parse(request.body)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    const [video] = await db.select({ id: videos.id }).from(videos).innerJoin(modules, eq(videos.moduleId, modules.id)).innerJoin(sections, eq(modules.milestoneId, sections.id)).where(and(eq(videos.id, params.videoId), eq(sections.courseId, params.id))).limit(1)
    if (!video) throw new HttpError(404, "Video not found.")
    const url = await uploadLectureMaterial({ base64: input.base64, contentType: input.contentType, courseId: params.id, fileName: input.fileName, kind: input.kind, lectureId: params.videoId })
    await db.update(videos).set(input.kind === "pdf" ? { pdfUrl: url } : { slidesUrl: url }).where(eq(videos.id, params.videoId))
    response.status(201).json({ url })
  }),
)

instructorCoursesRouter.post(
  "/:id/videos/:videoId/material-upload",
  raw({ limit: "30mb", type: () => true }),
  asyncHandler(async (request, response) => {
    const params = courseIdParamsSchema.extend({ videoId: z.string().uuid() }).parse(request.params)
    const query = materialUploadQuerySchema.parse(request.query)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    const [video] = await db.select({ id: videos.id }).from(videos).innerJoin(modules, eq(videos.moduleId, modules.id)).innerJoin(sections, eq(modules.milestoneId, sections.id)).where(and(eq(videos.id, params.videoId), eq(sections.courseId, params.id))).limit(1)
    if (!video) throw new HttpError(404, "Video not found.")
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) throw new HttpError(400, "Material file is required.")
    const contentType = request.get("content-type")?.split(";")[0] ?? "application/octet-stream"
    const url = await uploadLectureMaterial({ body: request.body, contentType, courseId: params.id, fileName: query.fileName, kind: query.kind, lectureId: params.videoId })
    await db.update(videos).set(query.kind === "pdf" ? { pdfUrl: url } : { slidesUrl: url }).where(eq(videos.id, params.videoId))
    response.status(201).json({ url })
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
    const assignmentDtos = await getInstructorAssignmentDtosForCourse(params.id)

    const sectionEntities = sectionRows.map((section) =>
      toInstructorSectionDto(
        section,
        lectureRows
          .filter((row) => row.lectures.sectionId === section.id)
          .map((row) => row.lectures),
        quizDtos.find((quiz) => quiz.sectionId === section.id) ?? null,
        quizDtos.filter((quiz) => Boolean(quiz.lectureId)),
        assignmentDtos.find((assignment) => assignment.sectionId === section.id) ??
          null,
        assignmentDtos.filter((assignment) => Boolean(assignment.lectureId)),
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

    const [lastMilestone] = await db
      .select({ position: sql<number>`coalesce(max(${sections.position}), -1)` })
      .from(sections)
      .where(eq(sections.courseId, params.id))

    const [created] = await db
      .insert(sections)
      .values({
        ...input,
        courseId: params.id,
        position: input.position ?? Number(lastMilestone?.position ?? -1) + 1,
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

instructorCoursesRouter.put(
  "/:id/sections/:sectionId/assignment",
  asyncHandler(async (request, response) => {
    const params = sectionIdParamsSchema.parse(request.params)
    const input = assignmentMutationSchema.parse(request.body)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)
    await assertSectionBelongsToCourse(params.sectionId, params.id)

    const assignment = await saveAssignmentForTarget({
      courseId: params.id,
      input,
      sectionId: params.sectionId,
    })

    response.status(200).json(assignment)
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

instructorCoursesRouter.put(
  "/:id/lectures/:lectureId/assignment",
  asyncHandler(async (request, response) => {
    const params = lectureIdParamsSchema.parse(request.params)
    const input = assignmentMutationSchema.parse(request.body)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)
    await assertLectureBelongsToCourse(params.lectureId, params.id)

    const assignment = await saveAssignmentForTarget({
      courseId: params.id,
      input,
      lectureId: params.lectureId,
    })

    response.status(200).json(assignment)
  }),
)

instructorCoursesRouter.put(
  "/:id/modules/:moduleId/quiz",
  asyncHandler(async (request, response) => {
    const params = moduleIdParamsSchema.parse(request.params)
    const input = quizMutationSchema.parse(request.body)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    const [module] = await db.select({ id: modules.id, contentTypes: modules.contentTypes }).from(modules).innerJoin(sections, eq(modules.milestoneId, sections.id)).where(and(eq(modules.id, params.moduleId), eq(sections.courseId, params.id))).limit(1)
    if (!module) throw new HttpError(404, "Module not found.")
    requireModuleContentType(module, "quiz")
    response.status(200).json(await saveQuizForTarget({ courseId: params.id, input, moduleId: params.moduleId }))
  }),
)

instructorCoursesRouter.put(
  "/:id/modules/:moduleId/assignment",
  asyncHandler(async (request, response) => {
    const params = moduleIdParamsSchema.parse(request.params)
    const input = assignmentMutationSchema.parse(request.body)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    const [module] = await db.select({ id: modules.id, contentTypes: modules.contentTypes }).from(modules).innerJoin(sections, eq(modules.milestoneId, sections.id)).where(and(eq(modules.id, params.moduleId), eq(sections.courseId, params.id))).limit(1)
    if (!module) throw new HttpError(404, "Module not found.")
    requireModuleContentType(module, "assignment")
    response.status(200).json(await saveAssignmentForTarget({ courseId: params.id, input, moduleId: params.moduleId }))
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

instructorCoursesRouter.delete(
  "/:id/assignments/:assignmentId",
  asyncHandler(async (request, response) => {
    const params = assignmentIdParamsSchema.parse(request.params)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)

    const [deleted] = await db
      .delete(assignments)
      .where(
        and(
          eq(assignments.id, params.assignmentId),
          eq(assignments.courseId, params.id),
        ),
      )
      .returning({ id: assignments.id })

    if (!deleted) {
      throw new HttpError(404, "Assignment not found.")
    }

    response.status(204).send()
  }),
)

instructorCoursesRouter.patch(
  "/:id/assignment-submissions/:submissionId/grade",
  asyncHandler(async (request, response) => {
    const params = assignmentSubmissionParamsSchema.parse(request.params)
    const input = assignmentGradeSchema.parse(request.body)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)

    await gradeAssignmentSubmission({
      courseId: params.id,
      gradeFeedback: input.gradeFeedback ?? null,
      gradeScore: input.gradeScore,
      graderProfileId: instructorId,
      submissionId: params.submissionId,
    })
    const [submission] = await db.select({ studentId: assignmentSubmissions.userId }).from(assignmentSubmissions).where(eq(assignmentSubmissions.id, params.submissionId)).limit(1)
    if (submission) {
      await createNotification({ body: input.gradeFeedback ?? `Your assignment received ${input.gradeScore} points.`, href: `/learn/${params.id}`, profileId: submission.studentId, title: "Your assignment was graded", type: "assignment_graded" })
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
  "/:id/lectures/:lectureId/video-upload",
  requireAuth,
  raw({ limit: "1024mb", type: "video/mp4" }),
  asyncHandler(async (request, response) => {
    const params = lectureIdParamsSchema.parse(request.params)
    const query = videoUploadQuerySchema.parse(request.query)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)
    await assertLectureBelongsToCourse(params.lectureId, params.id)

    if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
      throw new HttpError(400, "Video file is required.")
    }

    const videoRef = createLectureVideoKey({
      courseId: params.id,
      fileName: query.fileName,
      lectureId: params.lectureId,
    })

    await uploadLectureVideoToR2({
      body: request.body,
      contentType: "video/mp4",
      key: videoRef,
    })

    const [updated] = await db
      .update(lectures)
      .set({
        title: query.fileName,
        videoProvider: "r2",
        videoRef,
      })
      .where(eq(lectures.id, params.lectureId))
      .returning()

    if (!updated) {
      throw new HttpError(404, "Lecture not found.")
    }

    response.status(201).json({
      message: "Video uploaded and saved.",
    })
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

instructorCoursesRouter.post(
  "/:id/lectures/:lectureId/material",
  asyncHandler(async (request, response) => {
    const params = lectureIdParamsSchema.parse(request.params)
    const input = lectureMaterialUploadSchema.parse(request.body)
    const instructorId = request.auth!.profile!.id

    await assertInstructorOwnsCourse(params.id, instructorId)
    await assertLectureBelongsToCourse(params.lectureId, params.id)

    const url = await uploadLectureMaterial({
      base64: input.base64,
      contentType: input.contentType,
      courseId: params.id,
      fileName: input.fileName,
      kind: input.kind,
      lectureId: params.lectureId,
    })
    const [updated] = await db
      .update(lectures)
      .set(input.kind === "pdf" ? { pdfUrl: url } : { slidesUrl: url })
      .where(eq(lectures.id, params.lectureId))
      .returning()

    if (!updated) {
      throw new HttpError(404, "Lecture not found.")
    }

    response.status(201).json({
      lecture: toInstructorLectureDto(updated),
      url,
    } satisfies InstructorLectureMaterialUploadResponse)
  }),
)

instructorCoursesRouter.post(
  "/:id/lectures/:lectureId/material-upload",
  raw({ limit: "30mb", type: () => true }),
  asyncHandler(async (request, response) => {
    const params = lectureIdParamsSchema.parse(request.params)
    const query = materialUploadQuerySchema.parse(request.query)
    await assertInstructorOwnsCourse(params.id, request.auth!.profile!.id)
    await assertLectureBelongsToCourse(params.lectureId, params.id)
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) throw new HttpError(400, "Material file is required.")
    const contentType = request.get("content-type")?.split(";")[0] ?? "application/octet-stream"
    const url = await uploadLectureMaterial({ body: request.body, contentType, courseId: params.id, fileName: query.fileName, kind: query.kind, lectureId: params.lectureId })
    await db.update(lectures).set(query.kind === "pdf" ? { pdfUrl: url } : { slidesUrl: url }).where(eq(lectures.id, params.lectureId))
    response.status(201).json({ url })
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
