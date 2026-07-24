"use server"

import { revalidatePath } from "next/cache"
import type { PaymentOrderDto } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required.`)
  }

  return value.trim()
}

export async function approvePaymentAction(formData: FormData) {
  const orderId = getRequiredString(formData, "orderId")

  await authenticatedApiFetch<PaymentOrderDto>(
    `/payments/admin/orders/${orderId}/approve`,
    {
      method: "POST",
    },
  )

  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/admin/payments")
}

export async function rejectPaymentAction(formData: FormData) {
  const orderId = getRequiredString(formData, "orderId")
  const reason = getRequiredString(formData, "reason")

  await authenticatedApiFetch<PaymentOrderDto>(
    `/payments/admin/orders/${orderId}/reject`,
    {
      body: JSON.stringify({ reason }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  )

  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/admin/payments")
}
