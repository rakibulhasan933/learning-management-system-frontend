import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"

import { asyncHandler } from "../http/errors.js"
import { submitAssignment } from "../lib/assignments.js"
import { requireAuth, requireRole } from "../middleware/auth.js"

export const assignmentsRouter: ExpressRouter = Router()

const assignmentParamsSchema = z.object({
  assignmentId: z.string().uuid(),
})
const assignmentSubmissionSchema = z.object({
  submissionText: z.string().trim().min(1).max(20_000),
})

assignmentsRouter.use(requireAuth, requireRole(["admin", "student"]))

assignmentsRouter.post(
  "/:assignmentId/submit",
  asyncHandler(async (request, response) => {
    const params = assignmentParamsSchema.parse(request.params)
    const input = assignmentSubmissionSchema.parse(request.body)
    const submission = await submitAssignment({
      assignmentId: params.assignmentId,
      profileId: request.auth!.profile.id,
      submissionText: input.submissionText,
    })

    response.status(201).json(submission)
  }),
)
