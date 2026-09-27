import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import { courses, eq, quizzes } from "@workspace/db"

import { asyncHandler } from "../http/errors.js"
import {
  getStudentQuizByTarget,
  getStudentQuizDto,
  submitQuizAttempt,
} from "../lib/quizzes.js"
import { requireAuth, requireRole } from "../middleware/auth.js"
import { db } from "../lib/database.js"
import { createNotification } from "../lib/notifications.js"

export const quizzesRouter: ExpressRouter = Router()

const targetQuerySchema = z
  .object({
    lectureId: z.string().uuid().optional(),
    moduleId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
  })
  .refine(
    (input) =>
      [input.lectureId, input.moduleId, input.sectionId].filter(Boolean).length === 1,
    {
    message: "Provide exactly one quiz target.",
    },
  )
const quizParamsSchema = z.object({
  quizId: z.string().uuid(),
})
const submitQuizSchema = z.object({
  answers: z.record(z.string().uuid(), z.array(z.string().uuid())),
})

quizzesRouter.use(requireAuth, requireRole(["admin", "student"]))

quizzesRouter.get(
  "/target",
  asyncHandler(async (request, response) => {
    const query = targetQuerySchema.parse(request.query)
    const quiz = await getStudentQuizByTarget({
      lectureId: query.lectureId,
      moduleId: query.moduleId,
      profileId: request.auth!.profile.id,
      sectionId: query.sectionId,
    })

    response.status(200).json(quiz)
  }),
)

quizzesRouter.get(
  "/:quizId",
  asyncHandler(async (request, response) => {
    const params = quizParamsSchema.parse(request.params)
    const quiz = await getStudentQuizDto(params.quizId, request.auth!.profile.id)

    response.status(200).json(quiz)
  }),
)

quizzesRouter.post(
  "/:quizId/submit",
  asyncHandler(async (request, response) => {
    const params = quizParamsSchema.parse(request.params)
    const input = submitQuizSchema.parse(request.body)
    const result = await submitQuizAttempt({
      answers: input.answers,
      profileId: request.auth!.profile.id,
      quizId: params.quizId,
    })
    const [quiz] = await db.select({ courseId: quizzes.courseId, title: quizzes.title }).from(quizzes).where(eq(quizzes.id, params.quizId)).limit(1)
    if (quiz) {
      const [course] = await db.select({ instructorId: courses.instructorId, title: courses.title }).from(courses).where(eq(courses.id, quiz.courseId)).limit(1)
      if (course && course.instructorId !== request.auth!.profile.id) {
        await createNotification({ body: `A student submitted ${quiz.title}.`, href: `/dashboard/instructor/quiz-results`, profileId: course.instructorId, title: `New quiz result in ${course.title}`, type: "quiz_submission" })
      }
    }

    response.status(201).json(result)
  }),
)
