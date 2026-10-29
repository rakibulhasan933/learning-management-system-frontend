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

async function decidePayoutAction(formData: FormData, decision: string) {
  const payoutId = getRequiredString(formData, "payoutId")

  await authenticatedApiFetch<void>(
    `/admin/affiliate/payouts/${payoutId}/${decision}`,
    { method: "POST" }
  )

  revalidatePath("/dashboard/admin/affiliate-payouts")
}

export async function approveAffiliatePayoutAction(formData: FormData) {
  await decidePayoutAction(formData, "approve")
}

export async function rejectAffiliatePayoutAction(formData: FormData) {
  await decidePayoutAction(formData, "reject")
}

export async function markAffiliatePayoutPaidAction(formData: FormData) {
  await decidePayoutAction(formData, "mark-paid")
}
