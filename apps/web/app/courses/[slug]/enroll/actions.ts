"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { PaymentInstructionsResponse, PaymentOrderDto } from "@workspace/types"

import { ApiClientError, authenticatedApiFetch } from "@/lib/api-client"

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
  let orderId: string

  try {
    const response = await authenticatedApiFetch<PaymentInstructionsResponse>(
      "/payments/instructions",
      {
        body: JSON.stringify({ couponCode, courseId }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      },
    )

    revalidatePath("/dashboard/student")
    orderId = response.order.id
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      redirectToLogin(slug)
    }

    redirect(
      `/courses/${slug}?error=${encodeURIComponent(error instanceof Error ? error.message : "Enrollment could not be started.")}`,
    )
  }

  redirect(`/courses/${slug}/enroll?orderId=${orderId}`)
}

export async function submitPaymentProofAction(formData: FormData) {
  const orderId = getRequiredString(formData, "orderId")
  const slug = getRequiredString(formData, "slug")
  const paymentMethod = getRequiredString(formData, "paymentMethod")
  const transactionId = getRequiredString(formData, "transactionId")
  const senderNumber = getRequiredString(formData, "senderNumber")
  const screenshot = formData.get("proofScreenshot")
  let proofScreenshot:
    | { base64: string; contentType: string; fileName: string }
    | undefined

  if (screenshot instanceof File && screenshot.size > 0) {
    const bytes = Buffer.from(await screenshot.arrayBuffer())

    proofScreenshot = {
      base64: bytes.toString("base64"),
      contentType: screenshot.type || "application/octet-stream",
      fileName: screenshot.name || "payment-proof.jpg",
    }
  }

  try {
    await authenticatedApiFetch<PaymentOrderDto>(`/payments/orders/${orderId}/proof`, {
      body: JSON.stringify({
        paymentMethod,
        proofScreenshot,
        senderNumber,
        transactionId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      redirectToLogin(slug)
    }

    redirect(
      `/courses/${slug}/enroll?orderId=${orderId}&error=${encodeURIComponent(error instanceof Error ? error.message : "Payment proof could not be submitted.")}`,
    )
  }

  revalidatePath("/dashboard/student")
  redirect("/dashboard/student")
}
