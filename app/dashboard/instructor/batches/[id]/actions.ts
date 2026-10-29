"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type { BatchAnnouncementResponse } from "@/lib/types"
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

function toIsoOrUndefined(value: string | undefined) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date.")
  }

  return date.toISOString()
}

export async function addBatchMemberAction(formData: FormData) {
  const batchId = getRequiredString(formData, "batchId")

  await authenticatedApiFetch(`/instructor/batches/${batchId}/members`, {
    body: JSON.stringify({ userId: getRequiredString(formData, "userId") }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  revalidatePath(`/dashboard/instructor/batches/${batchId}`)
}

export async function addBatchDripAction(formData: FormData) {
  const batchId = getRequiredString(formData, "batchId")
  const releaseType = getRequiredString(formData, "releaseType")

  if (releaseType !== "relative" && releaseType !== "fixed") {
    throw new Error("Release type must be relative or fixed.")
  }

  const body: Record<string, unknown> = { releaseType }
  const milestoneId = getOptionalString(formData, "milestoneId")
  if (milestoneId) body.milestoneId = milestoneId
  const moduleId = getOptionalString(formData, "moduleId")
  if (moduleId) body.moduleId = moduleId
  const releaseDaysRaw = getOptionalString(formData, "releaseDays")
  if (releaseDaysRaw) body.releaseDays = Number(releaseDaysRaw)
  const releaseAt = toIsoOrUndefined(getOptionalString(formData, "releaseAt"))
  if (releaseAt) body.releaseAt = releaseAt

  await authenticatedApiFetch(`/instructor/batches/${batchId}/drip`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  revalidatePath(`/dashboard/instructor/batches/${batchId}`)
}

export async function addBatchDeadlineAction(formData: FormData) {
  const batchId = getRequiredString(formData, "batchId")
  const latePenaltyRaw = getOptionalString(formData, "latePenaltyPercent")

  const body: Record<string, unknown> = {
    allowLate: formData.get("allowLate") === "on",
    assignmentId: getRequiredString(formData, "assignmentId"),
    dueAt: new Date(getRequiredString(formData, "dueAt")).toISOString(),
  }
  // Default is 0 when the teacher does not set it: no marks are cut.
  // The form states this explicitly; the backend default is the same.
  if (latePenaltyRaw) body.latePenaltyPercent = Number(latePenaltyRaw)

  await authenticatedApiFetch(`/instructor/batches/${batchId}/deadlines`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  revalidatePath(`/dashboard/instructor/batches/${batchId}`)
}

/**
 * Batch announcement — this one is really SENT (a record is created),
 * unlike the seller-dashboard bulk announcement which is draft-only.
 * The page banner therefore says "পাঠানো" and never claims an email or
 * SMS was sent, because the contract does not promise delivery channels.
 */
export async function sendBatchAnnouncementAction(formData: FormData) {
  const batchId = getRequiredString(formData, "batchId")

  const response = await authenticatedApiFetch<BatchAnnouncementResponse>(
    `/instructor/batches/${batchId}/announcements`,
    {
      body: JSON.stringify({
        body: getRequiredString(formData, "body"),
        title: getRequiredString(formData, "title"),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )

  revalidatePath(`/dashboard/instructor/batches/${batchId}`)
  redirect(
    `/dashboard/instructor/batches/${batchId}?announced=${encodeURIComponent(String(response.recipientCount ?? 0))}`
  )
}
