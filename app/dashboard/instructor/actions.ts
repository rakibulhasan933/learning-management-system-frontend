"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { ApiClientError, authenticatedApiFetch } from "@/lib/api-client"

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

export async function requestInstructorPayoutAction(formData: FormData) {
  const amount = Number(getRequiredString(formData, "amount"))
  const currency = getOptionalString(formData, "currency") ?? "BDT"
  const note = getOptionalString(formData, "note")

  // If the backend still rejects instructor payouts (e.g. 403 while the
  // endpoint is being enabled), send the instructor back to the payouts
  // page with a plain error instead of crashing on an uncaught throw.
  let failure: string | null = null
  try {
    await authenticatedApiFetch("/instructor/payouts", {
      body: JSON.stringify({
        amount,
        currency,
        note,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
  } catch (error) {
    failure =
      error instanceof ApiClientError ? error.message : "Payout request failed."
  }

  if (failure) {
    redirect(
      `/dashboard/instructor/payouts?error=${encodeURIComponent(failure)}`
    )
  }

  revalidatePath("/dashboard/instructor")
  revalidatePath("/dashboard/instructor/payouts")
}

export async function createInstructorAnnouncementAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const title = getRequiredString(formData, "title")
  const body = getRequiredString(formData, "body")

  await authenticatedApiFetch(`/instructor/courses/${courseId}/announcements`, {
    body: JSON.stringify({ body, title }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  revalidatePath("/dashboard/instructor/announcements")
  revalidatePath("/dashboard/instructor/notifications")
}

export async function createInstructorDiscussionReplyAction(
  formData: FormData
) {
  const courseId = getRequiredString(formData, "courseId")
  const body = getRequiredString(formData, "body")
  const parentId = getOptionalString(formData, "parentId")

  await authenticatedApiFetch(`/instructor/courses/${courseId}/discussions`, {
    body: JSON.stringify({ body, parentId }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  revalidatePath("/dashboard/instructor/discussions")
}
