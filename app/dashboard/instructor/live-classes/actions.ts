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

function toIso(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date.")
  }

  return date.toISOString()
}

export async function createLiveClassAction(formData: FormData) {
  const provider = getRequiredString(formData, "provider")
  if (provider !== "meet" && provider !== "zoom" && provider !== "other") {
    throw new Error("Provider must be meet, zoom or other.")
  }

  const body: Record<string, unknown> = {
    courseId: getRequiredString(formData, "courseId"),
    meetingUrl: getRequiredString(formData, "meetingUrl"),
    provider,
    startsAt: toIso(getRequiredString(formData, "startsAt")),
    title: getRequiredString(formData, "title"),
  }
  const batchId = getOptionalString(formData, "batchId")
  if (batchId) body.batchId = batchId
  const endsAtRaw = getOptionalString(formData, "endsAt")
  if (endsAtRaw) body.endsAt = toIso(endsAtRaw)

  await authenticatedApiFetch("/instructor/live-classes", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  revalidatePath("/dashboard/instructor/live-classes")
}

export async function addLiveClassRecordingAction(formData: FormData) {
  const liveClassId = getRequiredString(formData, "liveClassId")

  const body: Record<string, unknown> = {
    recordingUrl: getRequiredString(formData, "recordingUrl"),
  }
  const title = getOptionalString(formData, "title")
  if (title) body.title = title

  await authenticatedApiFetch(
    `/instructor/live-classes/${liveClassId}/recording`,
    {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )

  revalidatePath("/dashboard/instructor/live-classes")
}

export async function markLiveClassAttendanceAction(formData: FormData) {
  const liveClassId = getRequiredString(formData, "liveClassId")

  await authenticatedApiFetch(
    `/instructor/live-classes/${liveClassId}/attendance`,
    {
      body: JSON.stringify({
        present: formData.get("present") === "yes",
        userId: getRequiredString(formData, "userId"),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )

  revalidatePath(
    `/dashboard/instructor/live-classes?classId=${encodeURIComponent(liveClassId)}`
  )
}
