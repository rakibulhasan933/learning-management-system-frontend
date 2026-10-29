"use server"

import { revalidatePath } from "next/cache"

import { authenticatedApiFetch } from "@/lib/api-client"

/**
 * Student refund request. The backend enforces the eligibility rules
 * (400 carries the rule text) and rejects duplicates (409). Money is never
 * moved by the system: payout is manual, the backend only records the
 * request and the admin's decision.
 */
export async function requestRefundAction(orderId: string, formData: FormData) {
  const reason = String(formData.get("reason") ?? "").trim()

  if (!reason) {
    throw new Error("রিফান্ডের কারণ লেখা আবশ্যক।")
  }

  await authenticatedApiFetch("/refund-requests", {
    body: JSON.stringify({ orderId, reason }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  revalidatePath(`/dashboard/student/orders/${orderId}/refund`)
}
