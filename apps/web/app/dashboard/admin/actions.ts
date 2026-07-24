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

export async function suspendUserAction(formData: FormData) {
  const userId = getRequiredString(formData, "userId")

  await authenticatedApiFetch<void>(`/admin/users/${userId}/suspend`, {
    method: "POST",
  })

  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/admin/users")
}

export async function activateUserAction(formData: FormData) {
  const userId = getRequiredString(formData, "userId")

  await authenticatedApiFetch<void>(`/admin/users/${userId}/activate`, {
    method: "POST",
  })

  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/admin/users")
}

export async function createInstructorAction(formData: FormData) {
  const email = getRequiredString(formData, "email")
  const password = getRequiredString(formData, "password")
  const fullName = formData.get("fullName")

  await authenticatedApiFetch<void>("/admin/users/instructors", {
    body: JSON.stringify({
      email,
      fullName:
        typeof fullName === "string" && fullName.trim().length > 0
          ? fullName.trim()
          : null,
      password,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/admin/users")
}

export async function approveCourseAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")

  await authenticatedApiFetch<void>(`/admin/courses/${courseId}/approve`, {
    method: "POST",
  })

  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/admin/courses")
}

export async function rejectCourseAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")

  await authenticatedApiFetch<void>(`/admin/courses/${courseId}/reject`, {
    method: "POST",
  })

  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/admin/courses")
}

export async function approvePayoutAction(formData: FormData) {
  const payoutId = getRequiredString(formData, "payoutId")

  await authenticatedApiFetch<void>(`/admin/payouts/${payoutId}/approve`, {
    method: "POST",
  })

  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/admin/payouts")
  revalidatePath("/dashboard/instructor")
  revalidatePath("/dashboard/instructor/payouts")
}

export async function rejectPayoutAction(formData: FormData) {
  const payoutId = getRequiredString(formData, "payoutId")
  const rejectionReason = getRequiredString(formData, "rejectionReason")

  await authenticatedApiFetch<void>(`/admin/payouts/${payoutId}/reject`, {
    body: JSON.stringify({ rejectionReason }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/admin/payouts")
  revalidatePath("/dashboard/instructor")
  revalidatePath("/dashboard/instructor/payouts")
}

export async function markPayoutPaidAction(formData: FormData) {
  const payoutId = getRequiredString(formData, "payoutId")

  await authenticatedApiFetch<void>(`/admin/payouts/${payoutId}/paid`, {
    method: "POST",
  })

  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/admin/payouts")
  revalidatePath("/dashboard/instructor")
  revalidatePath("/dashboard/instructor/payouts")
}
