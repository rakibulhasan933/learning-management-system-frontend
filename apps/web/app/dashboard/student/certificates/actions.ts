"use server"

import { redirect } from "next/navigation"
import type { CertificateDownloadResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

export async function downloadCertificateAction(formData: FormData) {
  const certificateId = String(formData.get("certificateId") ?? "")

  if (!certificateId) {
    return
  }

  const response = await authenticatedApiFetch<CertificateDownloadResponse>(
    `/certificates/${certificateId}/download-url`,
  )

  redirect(response.downloadUrl)
}
