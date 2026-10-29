import { notFound, redirect } from "next/navigation"
import type { PaymentInstructionsResponse, ProfileDto } from "@/lib/types"

import GatewayCheckout from "@/components/gateway-checkout"
import { AbandonedCartRecorder } from "@/components/abandoned-cart-recorder"
import { ApiClientError, authenticatedApiFetch } from "@/lib/api-client"

const gateways = ["bkash", "nagad", "rocket"] as const

export const dynamic = "force-dynamic"

export default async function GatewayCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ gateway: string }>
  searchParams: Promise<{ order_id?: string; error?: string }>
}) {
  const { gateway } = await params
  const query = await searchParams

  if (
    !gateways.includes(gateway as (typeof gateways)[number]) ||
    !query.order_id
  ) {
    notFound()
  }

  let orderResponse: PaymentInstructionsResponse
  let profile: ProfileDto

  try {
    ;[orderResponse, profile] = await Promise.all([
      authenticatedApiFetch<PaymentInstructionsResponse>(
        `/payments/orders/${query.order_id}/instructions`,
        { cache: "no-store" }
      ),
      authenticatedApiFetch<ProfileDto>("/auth/me", { cache: "no-store" }),
    ])
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      redirect(
        `/auth/login?next=${encodeURIComponent(`/checkout/${gateway}?order_id=${query.order_id}`)}`
      )
    }

    throw error
  }

  const { instructions, order } = orderResponse
  const receiverNumber =
    gateway === "nagad"
      ? instructions.nagadNumber
      : gateway === "rocket"
        ? instructions.rocketNumber
        : instructions.bkashNumber

  if (!receiverNumber) {
    throw new Error(`${gateway} receiver number is not configured.`)
  }

  return (
    <>
      <AbandonedCartRecorder courseId={order.courseId} />
      <GatewayCheckout
      amount={order.amount}
      customerEmail={profile.email}
      error={query.error}
      gateway={gateway as "bkash" | "nagad" | "rocket"}
      orderId={order.id}
      packageName={order.courseTitle}
      receiverNumber={receiverNumber}
      slug={order.courseSlug}
      />
    </>
  )
}
