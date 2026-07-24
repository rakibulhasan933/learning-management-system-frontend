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

export async function requestInstructorPayoutAction(formData: FormData) {
  const amount = Number(getRequiredString(formData, "amount"))
  const currency = getOptionalString(formData, "currency") ?? "BDT"
  const note = getOptionalString(formData, "note")

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

  revalidatePath("/dashboard/instructor")
  revalidatePath("/dashboard/instructor/payouts")
}
