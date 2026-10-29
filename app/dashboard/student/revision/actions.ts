"use server"

import { revalidatePath } from "next/cache"

import { authenticatedApiFetch } from "@/lib/api-client"

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required.`)
  }

  return value.trim()
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : undefined
}

function revalidateRevision() {
  revalidatePath("/dashboard/student/revision")
}

export async function createFlashcardAction(formData: FormData) {
  const body: Record<string, unknown> = {
    back: getRequiredString(formData, "back"),
    front: getRequiredString(formData, "front"),
  }
  const subject = getOptionalString(formData, "subject")
  if (subject) body.subject = subject
  const chapter = getOptionalString(formData, "chapter")
  if (chapter) body.chapter = chapter
  const topic = getOptionalString(formData, "topic")
  if (topic) body.topic = topic
  const questionBankQuestionId = getOptionalString(
    formData,
    "questionBankQuestionId"
  )
  if (questionBankQuestionId) body.questionBankQuestionId = questionBankQuestionId

  await authenticatedApiFetch("/student/flashcards", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  revalidateRevision()
}

/** SM-2-style review (quality 0–5). This is not FSRS. */
export async function reviewFlashcardAction(formData: FormData) {
  const flashcardId = getRequiredString(formData, "flashcardId")
  const quality = Number(getRequiredString(formData, "quality"))

  if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
    throw new Error("Quality must be a whole number from 0 to 5.")
  }

  await authenticatedApiFetch(`/student/flashcards/${flashcardId}/review`, {
    body: JSON.stringify({ quality }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  revalidateRevision()
}

export async function createBookmarkAction(formData: FormData) {
  const type = getRequiredString(formData, "type")
  if (type !== "question" && type !== "lesson") {
    throw new Error("Bookmark type must be question or lesson.")
  }

  await authenticatedApiFetch("/student/bookmarks", {
    body: JSON.stringify({
      targetId: getRequiredString(formData, "targetId"),
      type,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  revalidateRevision()
}

export async function deleteBookmarkAction(formData: FormData) {
  const bookmarkId = getRequiredString(formData, "bookmarkId")

  await authenticatedApiFetch(`/student/bookmarks/${bookmarkId}`, {
    method: "DELETE",
  })

  revalidateRevision()
}

export async function createNoteAction(formData: FormData) {
  const body: Record<string, unknown> = {
    body: getRequiredString(formData, "body"),
  }
  const lessonId = getOptionalString(formData, "lessonId")
  if (lessonId) body.lessonId = lessonId
  const questionId = getOptionalString(formData, "questionId")
  if (questionId) body.questionId = questionId

  await authenticatedApiFetch("/student/notes", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  revalidateRevision()
}

export async function updateNoteAction(formData: FormData) {
  const noteId = getRequiredString(formData, "noteId")

  await authenticatedApiFetch(`/student/notes/${noteId}`, {
    body: JSON.stringify({ body: getRequiredString(formData, "body") }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  })

  revalidateRevision()
}

export async function deleteNoteAction(formData: FormData) {
  const noteId = getRequiredString(formData, "noteId")

  await authenticatedApiFetch(`/student/notes/${noteId}`, {
    method: "DELETE",
  })

  revalidateRevision()
}
