"use server"

import type {
  LectureProgressMutationResponse,
  LectureVideoUrlResponse,
  QuizSubmissionResultDto,
  StudentAssignmentSubmissionDto,
} from "@workspace/types"

import {
  authenticatedApiFetch,
  optionalAuthenticatedApiFetch,
} from "@/lib/api-client"

export async function getLectureVideoUrlAction(lectureId: string) {
  return optionalAuthenticatedApiFetch<LectureVideoUrlResponse>(
    `/lectures/videos/${lectureId}/video-url`,
    { cache: "no-store" },
  )
}

export async function saveLectureProgressAction(input: {
  isCompleted?: boolean
  lectureId: string
  positionSeconds: number
}) {
  return authenticatedApiFetch<LectureProgressMutationResponse>(
    `/progress/videos/${input.lectureId}`,
    {
      body: JSON.stringify({
        isCompleted: input.isCompleted,
        positionSeconds: input.positionSeconds,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    },
  )
}

export async function submitQuizAction(input: {
  answers: Record<string, string[]>
  quizId: string
}) {
  return authenticatedApiFetch<QuizSubmissionResultDto>(
    `/quizzes/${input.quizId}/submit`,
    {
      body: JSON.stringify({ answers: input.answers }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  )
}

export async function submitAssignmentAction(input: {
  assignmentId: string
  submissionText: string
}) {
  return authenticatedApiFetch<StudentAssignmentSubmissionDto>(
    `/assignments/${input.assignmentId}/submit`,
    {
      body: JSON.stringify({ submissionText: input.submissionText }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  )
}
