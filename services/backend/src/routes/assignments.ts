import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import { assignments, courses, eq } from "@workspace/db"

import { asyncHandler } from "../http/errors.js"
import { submitAssignment } from "../lib/assignments.js"
import { db } from "../lib/database.js"
import { createNotification } from "../lib/notifications.js"
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
    const [assignment] = await db
      .select({ courseId: assignments.courseId, title: assignments.title })
      .from(assignments)
      .where(eq(assignments.id, params.assignmentId))
      .limit(1)
    if (assignment) {
      const [course] = await db
        .select({ instructorId: courses.instructorId, title: courses.title })
        .from(courses)
        .where(eq(courses.id, assignment.courseId))
        .limit(1)
      if (course && course.instructorId !== request.auth!.profile.id) {
        await createNotification({
          body: `A student submitted ${assignment.title}.`,
          href: `/dashboard/instructor/courses/${assignment.courseId}/edit`,
          profileId: course.instructorId,
          title: `New assignment submission in ${course.title}`,
          type: "assignment_submission",
        })
      }
    }

    response.status(201).json(submission)
  })
)
