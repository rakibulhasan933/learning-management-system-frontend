"use server"

import { redirect } from "next/navigation"

import { authenticatedApiFetch } from "@/lib/api-client"

/**
 * negativeMark is per-test and defaults to 0. BCS (-0.50) and admission
 * (-0.25) appear only as hint text in the form, never as a preselected
 * universal default.
 */
export async function createModelTestAction(formData: FormData) {
  const title = formData.get("title")
  const courseId = formData.get("courseId")
  const durationMinutes = Number(formData.get("durationMinutes"))
  const negativeMarkRaw = formData.get("negativeMark")
  const maxAttemptsRaw = formData.get("maxAttempts")
  const isPublished = formData.get("isPublished") === "on"
  const shuffleQuestions = formData.get("shuffleQuestions") !== "off"
  const questionIds = formData
    .getAll("questionIds")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean)

  if (typeof title !== "string" || title.trim().length < 2) {
    throw new Error("Model test title is required.")
  }
  if (typeof courseId !== "string" || courseId.trim().length === 0) {
    throw new Error("Pick one of your own courses.")
  }
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 600
  ) {
    throw new Error("Duration must be between 1 and 600 minutes.")
  }
  const negativeMark =
    typeof negativeMarkRaw === "string" && negativeMarkRaw.trim() !== ""
      ? Number(negativeMarkRaw)
      : 0
  if (!Number.isFinite(negativeMark) || negativeMark < 0 || negativeMark > 5) {
    throw new Error("Negative mark must be between 0 and 5.")
  }
  const maxAttempts =
    typeof maxAttemptsRaw === "string" && maxAttemptsRaw.trim() !== ""
      ? Number(maxAttemptsRaw)
      : 1
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) {
    throw new Error("Max attempts must be between 1 and 20.")
  }

  const response = await authenticatedApiFetch<{ test: { id: string } }>(
    "/model-tests",
    {
      body: JSON.stringify({
        courseId: courseId.trim(),
        durationMinutes,
        isPublished,
        maxAttempts,
        negativeMark,
        questions: [...new Set(questionIds)].map((questionId) => ({
          questionId,
        })),
        shuffleQuestions,
        title: title.trim(),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
  redirect(`/dashboard/instructor/model-tests/${response.test.id}`)
}
