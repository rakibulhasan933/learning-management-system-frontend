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

export async function assignCourseCategoryAction(formData: FormData) {
  await authenticatedApiFetch<void>(`/admin/courses/${getRequiredString(formData, "courseId")}/category`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: String(formData.get("category") ?? "").trim() || null }) })
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

export async function createCategoryAction(formData: FormData) {
  await authenticatedApiFetch<void>("/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: getRequiredString(formData, "name"), slug: getRequiredString(formData, "slug"), description: String(formData.get("description") ?? "").trim() || null }) })
  revalidatePath("/dashboard/admin/categories")
}

export async function deleteCategoryAction(formData: FormData) {
  await authenticatedApiFetch<void>(`/admin/categories/${getRequiredString(formData, "categoryId")}`, { method: "DELETE" })
  revalidatePath("/dashboard/admin/categories")
}

export async function updateAdminSettingsAction(formData: FormData) {
  const settings: Record<string, string> = {}
  for (const [key, value] of formData.entries()) if (typeof value === "string") settings[key] = value.trim()
  await authenticatedApiFetch<void>("/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings }) })
  revalidatePath("/dashboard/admin/settings")
}

export async function sendAdminAnnouncementAction(formData: FormData) {
  await authenticatedApiFetch<void>("/admin/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audience: getRequiredString(formData, "audience"), title: getRequiredString(formData, "title"), body: getRequiredString(formData, "body") }) })
  revalidatePath("/dashboard/admin/announcements")
}

export async function setEnrollmentStatusAction(formData: FormData) {
  const id = getRequiredString(formData, "enrollmentId")
  const action = getRequiredString(formData, "action")
  await authenticatedApiFetch<void>(`/admin/enrollments/${id}/${action}`, { method: "PATCH" })
  revalidatePath("/dashboard/admin/enrollments")
}

export async function createRefundAction(formData: FormData) {
  await authenticatedApiFetch<void>("/admin/refunds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: getRequiredString(formData, "orderId"), amount: Number(getRequiredString(formData, "amount")), reason: getRequiredString(formData, "reason") }) })
  revalidatePath("/dashboard/admin/refunds")
}

export async function decideRefundAction(formData: FormData) {
  const id = getRequiredString(formData, "refundId")
  const action = getRequiredString(formData, "action")
  await authenticatedApiFetch<void>(`/admin/refunds/${id}/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: String(formData.get("reason") ?? "").trim() || undefined }) })
  revalidatePath("/dashboard/admin/refunds")
}
