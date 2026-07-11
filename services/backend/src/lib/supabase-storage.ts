import { randomUUID } from "node:crypto"

import { env } from "../config/env.js"
import { HttpError } from "../http/errors.js"

const defaultPaymentProofBucket = "payment-proofs"
const defaultCertificatesBucket = "certificates"
const maxProofBytes = 5 * 1024 * 1024

function getSupabaseStorageUrl() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new HttpError(503, "Supabase Storage is not configured.")
  }

  const url = new URL(env.SUPABASE_URL)

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new HttpError(503, "Supabase Storage URL must be an HTTP(S) project URL.")
  }

  return {
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    url,
  }
}

export async function uploadPaymentProofScreenshot({
  base64,
  contentType,
  fileName,
  orderId,
}: {
  base64: string
  contentType: string
  fileName: string
  orderId: string
}) {
  const storage = getSupabaseStorageUrl()

  if (!contentType.startsWith("image/")) {
    throw new HttpError(400, "Payment proof must be an image.")
  }

  const body = Buffer.from(base64, "base64")

  if (body.length > maxProofBytes) {
    throw new HttpError(400, "Payment proof image must be 5 MB or smaller.")
  }

  const bucket =
    env.SUPABASE_STORAGE_PAYMENT_PROOFS_BUCKET ?? defaultPaymentProofBucket
  const extension = fileName.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "jpg"
  const objectKey = `${orderId}/${randomUUID()}.${extension}`
  const uploadUrl = new URL(
    `/storage/v1/object/${bucket}/${objectKey}`,
    storage.url,
  )

  const response = await fetch(uploadUrl, {
    body,
    headers: {
      Authorization: `Bearer ${storage.serviceRoleKey}`,
      "Content-Type": contentType,
      apikey: storage.serviceRoleKey,
      "x-upsert": "true",
    },
    method: "POST",
  })

  if (!response.ok) {
    throw new HttpError(502, "Payment proof upload failed.")
  }

  return new URL(`/storage/v1/object/public/${bucket}/${objectKey}`, storage.url)
    .toString()
}

export async function uploadCertificatePdf({
  certificateId,
  pdf,
}: {
  certificateId: string
  pdf: Buffer
}) {
  const storage = getSupabaseStorageUrl()

  const bucket =
    env.SUPABASE_STORAGE_CERTIFICATES_BUCKET ?? defaultCertificatesBucket
  const objectKey = `${certificateId}/certificate.pdf`
  const uploadUrl = new URL(
    `/storage/v1/object/${bucket}/${objectKey}`,
    storage.url,
  )

  const response = await fetch(uploadUrl, {
    body: pdf as unknown as BodyInit,
    headers: {
      Authorization: `Bearer ${storage.serviceRoleKey}`,
      "Content-Type": "application/pdf",
      apikey: storage.serviceRoleKey,
      "x-upsert": "true",
    },
    method: "POST",
  })

  if (!response.ok) {
    throw new HttpError(502, "Certificate upload failed.")
  }

  return new URL(`/storage/v1/object/public/${bucket}/${objectKey}`, storage.url)
    .toString()
}
