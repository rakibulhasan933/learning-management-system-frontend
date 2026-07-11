"use server"

import type { LectureVideoUrlResponse, QuizSubmissionResultDto } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

export async function getLectureVideoUrlAction(lectureId: string) {
  return authenticatedApiFetch<LectureVideoUrlResponse>(
    `/lectures/${lectureId}/video-url`,
    { cache: "no-store" },
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
