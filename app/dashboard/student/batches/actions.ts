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

export async function joinBatchAction(formData: FormData) {
  const batchId = getRequiredString(formData, "batchId")

  await authenticatedApiFetch(`/batches/${batchId}/join`, {
    method: "POST",
  })

  revalidatePath("/dashboard/student/batches")
}
