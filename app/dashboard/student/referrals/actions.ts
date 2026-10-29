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

/** Student referral link: isReferral is always true here. */
export async function createReferralLinkAction(formData: FormData) {
  const commissionType = getRequiredString(formData, "commissionType")
  const commissionValue = Number(getRequiredString(formData, "commissionValue"))

  if (commissionType !== "percent" && commissionType !== "flat") {
    throw new Error("Commission type must be percent or flat.")
  }
  if (!Number.isFinite(commissionValue) || commissionValue < 0) {
    throw new Error("Commission value must be zero or more.")
  }

  const body: Record<string, unknown> = {
    commissionType,
    commissionValue,
    isReferral: true,
  }
  const code = getOptionalString(formData, "code")
  if (code) body.code = code

  await authenticatedApiFetch("/affiliate/links", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  revalidatePath("/dashboard/student/referrals")
}

export async function requestReferralPayoutAction(formData: FormData) {
  const amount = Number(getRequiredString(formData, "amount"))

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payout amount must be more than zero.")
  }

  const body: Record<string, unknown> = { amount }
  const note = getOptionalString(formData, "note")
  if (note) body.note = note

  await authenticatedApiFetch("/affiliate/payouts", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  revalidatePath("/dashboard/student/referrals")
}
