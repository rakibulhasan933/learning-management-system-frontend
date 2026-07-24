import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"

import { asyncHandler } from "../http/errors.js"
import {
  getStudentQuizByTarget,
  getStudentQuizDto,
  submitQuizAttempt,
} from "../lib/quizzes.js"
import { requireAuth, requireRole } from "../middleware/auth.js"

export const quizzesRouter: ExpressRouter = Router()

const targetQuerySchema = z
  .object({
    lectureId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
  })
  .refine((input) => Boolean(input.lectureId) !== Boolean(input.sectionId), {
    message: "Provide exactly one quiz target.",
  })
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

    response.status(201).json(result)
  }),
)
