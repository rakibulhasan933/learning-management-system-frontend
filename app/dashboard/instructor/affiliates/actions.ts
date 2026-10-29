"use server"

import { revalidatePath } from "next/cache"

import {
  authenticatedApiFetch,
  optionalAuthenticatedApiFetch,
} from "@/lib/api-client"

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

/**
 * Best-effort affiliate click tracking. It never throws: a failed track
 * call must never break a course/bundle page or a checkout.
 * Uses optional auth so an anonymous visitor's ?ref= click is still
 * recorded when the backend accepts anonymous tracking.
 */
export async function trackAffiliateAction(code: string) {
  if (!code.trim()) {
    return false
  }

  try {
    await optionalAuthenticatedApiFetch("/affiliate/track", {
      body: JSON.stringify({ code: code.trim() }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    return true
  } catch {
    return false
  }
}

/**
 * Best-effort attribution after an order is created. It never throws and
 * never changes the order: on failure the order still stands and the
 * attribution is simply lost, which the caller must not hide.
 */
export async function attributeAffiliateOrderAction(
  code: string,
  orderId: string
) {
  if (!code.trim() || !orderId.trim()) {
    return false
  }

  try {
    await authenticatedApiFetch("/affiliate/attribute", {
      body: JSON.stringify({ code: code.trim(), orderId: orderId.trim() }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    return true
  } catch {
    return false
  }
}

export async function createAffiliateLinkAction(formData: FormData) {
  const commissionType = getRequiredString(formData, "commissionType")
  const commissionValue = Number(getRequiredString(formData, "commissionValue"))
  const revalidate = getOptionalString(formData, "revalidatePath") ?? ""

  if (commissionType !== "percent" && commissionType !== "flat") {
    throw new Error("Commission type must be percent or flat.")
  }
  if (!Number.isFinite(commissionValue) || commissionValue < 0) {
    throw new Error("Commission value must be zero or more.")
  }

  const body: Record<string, unknown> = {
    commissionType,
    commissionValue,
  }
  const code = getOptionalString(formData, "code")
  if (code) body.code = code
  const scopeType = getOptionalString(formData, "scopeType")
  if (scopeType) body.scopeType = scopeType
  const scopeId = getOptionalString(formData, "scopeId")
  if (scopeId) body.scopeId = scopeId
  if (formData.get("isReferral") === "on") body.isReferral = true

  await authenticatedApiFetch("/affiliate/links", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  if (revalidate) revalidatePath(revalidate)
}

export async function requestAffiliatePayoutAction(formData: FormData) {
  const amount = Number(getRequiredString(formData, "amount"))
  const revalidate = getOptionalString(formData, "revalidatePath") ?? ""

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

  if (revalidate) revalidatePath(revalidate)
}
