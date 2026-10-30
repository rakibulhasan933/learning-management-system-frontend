"use server"

import { revalidatePath } from "next/cache"

import type { InstalmentScheduleResponse, OrderBumpResponse } from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"

/**
 * Instalment actions. The sum check also runs client-side before this
 * action is called; the backend re-validates that instalments sum
 * exactly to the order amount.
 */
export async function defineInstalmentsAction(
  orderId: string,
  instalments: Array<{ amount: number; dueDate: string }>
) {
  const response = await authenticatedApiFetch<InstalmentScheduleResponse>(
    `/orders/${orderId}/instalments`,
    {
      body: JSON.stringify({ instalments }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
  revalidatePath(`/dashboard/student/orders/${orderId}/instalments`)
  return response
}

/** Pay one instalment with a PayConfirm-verified sender number + transaction id. */
export async function payInstalmentAction(formData: FormData) {
  const orderId = formData.get("orderId")
  const instalmentId = formData.get("instalmentId")
  const senderNumber = formData.get("senderNumber")
  const transactionId = formData.get("transactionId")
  if (
    typeof orderId !== "string" ||
    typeof instalmentId !== "string" ||
    typeof senderNumber !== "string" ||
    typeof transactionId !== "string"
  ) {
    throw new Error(
      "Order, instalment, sender number and transaction id are required."
    )
  }
  const response = await authenticatedApiFetch<InstalmentScheduleResponse>(
    `/orders/${orderId.trim()}/instalments/${instalmentId.trim()}/pay`,
    {
      body: JSON.stringify({
        senderNumber: senderNumber.trim(),
        transactionId: transactionId.trim(),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
  revalidatePath(`/dashboard/student/orders/${orderId.trim()}/instalments`)
  return response
}

export async function addOrderBumpAction(formData: FormData) {
  const orderId = formData.get("orderId")
  const courseId = formData.get("courseId")
  if (typeof orderId !== "string" || typeof courseId !== "string") {
    throw new Error("Order id and course id are required.")
  }
  const response = await authenticatedApiFetch<OrderBumpResponse>(
    "/checkout/order-bump",
    {
      body: JSON.stringify({
        courseId: courseId.trim(),
        orderId: orderId.trim(),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
  revalidatePath(`/dashboard/student/orders/${orderId.trim()}/instalments`)
  return response
}
