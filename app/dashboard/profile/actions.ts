"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { ProfileDto } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

export async function updateProfileAction(formData: FormData) {
  const fullName = getOptionalString(formData, "fullName")
  const avatarUrl = getOptionalString(formData, "avatarUrl")

  await authenticatedApiFetch<ProfileDto>("/auth/me", {
    body: JSON.stringify({
      avatarUrl,
      fullName,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  })

  revalidatePath("/dashboard")
  redirect("/dashboard/profile")
}
