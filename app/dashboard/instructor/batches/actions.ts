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

export async function createBatchAction(formData: FormData) {
  const body: Record<string, unknown> = {
    courseId: getRequiredString(formData, "courseId"),
    name: getRequiredString(formData, "name"),
  }
  const enrolmentStartAt = toIsoOrUndefined(
    getOptionalString(formData, "enrolmentStartAt")
  )
  if (enrolmentStartAt) body.enrolmentStartAt = enrolmentStartAt
  const enrolmentEndAt = toIsoOrUndefined(
    getOptionalString(formData, "enrolmentEndAt")
  )
  if (enrolmentEndAt) body.enrolmentEndAt = enrolmentEndAt

  await authenticatedApiFetch("/instructor/batches", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  revalidatePath("/dashboard/instructor/batches")
}
