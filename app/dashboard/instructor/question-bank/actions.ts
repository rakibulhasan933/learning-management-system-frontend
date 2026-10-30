"use server"

import { revalidatePath } from "next/cache"

import type { QuestionImportResponse } from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"

/**
 * CSV import. The file is read as text on the server and sent as JSON
 * {csv, courseId?, quizId?} — one of the documented backend shapes —
 * so no multipart parsing is needed on the frontend.
 * Malformed lines are skipped by the backend, never a whole-import failure.
 */
export async function importQuestionBankAction(formData: FormData) {
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a CSV file to import.")
  }
  const csv = await file.text()
  const courseId = formData.get("courseId")
  const quizId = formData.get("quizId")
  const payload: Record<string, unknown> = { csv }
  if (typeof courseId === "string" && courseId.trim() !== "") {
    payload.courseId = courseId.trim()
  }
  if (typeof quizId === "string" && quizId.trim() !== "") {
    payload.quizId = quizId.trim()
  }
  return authenticatedApiFetch<QuestionImportResponse>(
    "/instructor/question-bank/import",
    {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
}

export async function attachBankQuestionAction(formData: FormData) {
  const questionId = formData.get("questionId")
  const testId = formData.get("testId")
  if (typeof questionId !== "string" || typeof testId !== "string") {
    throw new Error("Question id and model test id are required.")
  }
  const result = await authenticatedApiFetch<{
    questionId: string
    testId: string
  }>(`/instructor/question-bank/${questionId.trim()}/attach`, {
    body: JSON.stringify({ testId: testId.trim() }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  revalidatePath("/dashboard/instructor/question-bank")
  return result
}
