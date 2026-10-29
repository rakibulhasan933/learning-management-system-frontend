"use server"

import { redirect } from "next/navigation"

import type {
  BundleOrderResponse,
  SubscriptionResponse,
} from "@/lib/types"
import { ApiClientError, authenticatedApiFetch } from "@/lib/api-client"
import { attributeAffiliateOrderAction } from "@/app/dashboard/instructor/affiliates/actions"

/**
 * Feature 2 server actions. Every purchase goes through the existing
 * PayConfirm proof flow unchanged: the created order id is what the
 * student pays for at /checkout/bkash?order_id=<id>.
 */

export async function createBundleOrderAction(
  bundleId: string,
  refCode?: string
) {
  let response: BundleOrderResponse
  try {
    response = await authenticatedApiFetch<BundleOrderResponse>(
      "/orders/bundle",
      {
        body: JSON.stringify({ bundleId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }
    )
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 503) {
      redirect(`/bundles?error=${encodeURIComponent("migration_pending")}`)
    }
    throw error
  }
  // Best-effort referral attribution only; never changes the order or
  // the PayConfirm redirect. A failed attribute call loses attribution,
  // not the purchase.
  if (refCode?.trim()) {
    await attributeAffiliateOrderAction(refCode.trim(), response.order.id)
  }
  redirect(`/checkout/bkash?order_id=${response.order.id}`)
}

export async function createSubscriptionAction(formData: FormData) {
  const targetType = formData.get("targetType")
  const targetId = formData.get("targetId")
  const months = Number(formData.get("months"))
  if (targetType !== "course" && targetType !== "bundle") {
    throw new Error("Target type must be course or bundle.")
  }
  if (typeof targetId !== "string" || targetId.trim().length === 0) {
    throw new Error("Target id is required.")
  }
  if (!Number.isInteger(months) || months < 1 || months > 24) {
    throw new Error("Months must be between 1 and 24.")
  }
  let response: SubscriptionResponse
  try {
    response = await authenticatedApiFetch<SubscriptionResponse>(
      "/subscriptions",
      {
        body: JSON.stringify({
          months,
          targetId: targetId.trim(),
          targetType,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }
    )
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 503) {
      redirect(`/bundles?error=${encodeURIComponent("migration_pending")}`)
    }
    throw error
  }
  redirect(`/checkout/bkash?order_id=${response.order.id}`)
}

/** Best-effort only: callers must never await this as a blocking step. */
export async function recordAbandonedCartAction(input: {
  items: Array<{ courseId?: string; bundleId?: string }>
  startedAt: string
}) {
  try {
    await authenticatedApiFetch("/carts/abandoned", {
      body: JSON.stringify(input),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    return { recorded: true }
  } catch {
    // Abandoned-cart recording must never break checkout or navigation.
    return { recorded: false }
  }
}
