"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { PaymentInstructionsResponse, PaymentOrderDto } from "@/lib/types"

import { ApiClientError, authenticatedApiFetch } from "@/lib/api-client"
import { attributeAffiliateOrderAction } from "@/app/dashboard/instructor/affiliates/actions"

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

function redirectToLogin(slug: string): never {
  redirect(`/auth/login?next=${encodeURIComponent(`/courses/${slug}/enroll`)}`)
}

export async function createEnrollmentOrderAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const slug = getRequiredString(formData, "slug")
  const couponCode = getOptionalString(formData, "couponCode")
  const refCode = getOptionalString(formData, "refCode")
  let orderId: string
  let orderStatus: PaymentOrderDto["status"]

  try {
    const response = await authenticatedApiFetch<PaymentInstructionsResponse>(
      "/payments/instructions",
      {
        body: JSON.stringify({ couponCode, courseId }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    )

    revalidatePath("/dashboard/student")
    orderId = response.order.id
    orderStatus = response.order.status

    // Best-effort referral attribution only. It never throws and never
    // changes the order, the redirect, or the PayConfirm flow: if the
    // attribute call fails, the order still stands.
    if (refCode) {
      await attributeAffiliateOrderAction(refCode, orderId)
    }
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      redirectToLogin(slug)
    }

    redirect(
      `/courses/${slug}?error=${encodeURIComponent(error instanceof Error ? error.message : "Enrollment could not be started.")}`
    )
  }

  if (orderStatus === "paid") {
    redirect("/dashboard/student")
  }

  redirect(`/checkout/bkash?order_id=${encodeURIComponent(orderId)}`)
}

export async function previewCouponAction(
  courseId: string,
  couponCode: string
) {
  return authenticatedApiFetch<{
    amount: string
    couponCode: string | null
    currency: string
    discountAmount: string
    originalAmount: string
  }>("/payments/coupons/preview", {
    body: JSON.stringify({ courseId, couponCode }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
}

export async function submitPaymentProofAction(formData: FormData) {
  const orderId = getRequiredString(formData, "orderId")
  const slug = getRequiredString(formData, "slug")
  const gateway = getOptionalString(formData, "gateway") ?? "bkash"
  const transactionId = getRequiredString(formData, "transactionId")
  const senderNumber = getRequiredString(formData, "senderNumber")
  const checkoutPath = `/checkout/${gateway}?order_id=${encodeURIComponent(orderId)}`
  let paidOrder: PaymentOrderDto

  console.info("[payment][web] Submitting payment proof", {
    gateway,
    orderId,
    senderNumber:
      senderNumber.length > 4
        ? `${senderNumber.slice(0, 2)}****${senderNumber.slice(-2)}`
        : "****",
    transactionId:
      transactionId.length > 4
        ? `${transactionId.slice(0, 2)}****${transactionId.slice(-2)}`
        : "****",
  })

  try {
    paidOrder = await authenticatedApiFetch<PaymentOrderDto>(
      `/payments/orders/${orderId}/proof`,
      {
        body: JSON.stringify({
          senderNumber,
          transactionId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    )
  } catch (error) {
    console.error("[payment][web] Payment verification failed", {
      error: error instanceof Error ? error.message : String(error),
      orderId,
      status: error instanceof ApiClientError ? error.status : null,
    })
    if (error instanceof ApiClientError && error.status === 401) {
      redirectToLogin(slug)
    }

    redirect(
      `${checkoutPath}&error=${encodeURIComponent(error instanceof Error ? error.message : "Payment could not be verified.")}`
    )
  }

  revalidatePath("/dashboard/student")
  revalidatePath(`/learn/${paidOrder.courseId}`)
  redirect(
    `/payment/success?course=${encodeURIComponent(paidOrder.courseTitle)}`
  )
}
