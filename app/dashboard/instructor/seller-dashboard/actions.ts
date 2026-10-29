"use server"

import { cookies } from "next/headers"

import type { AnnouncementDraftResponse } from "@/lib/types"
import {
  accessTokenCookieName,
  authenticatedApiFetch,
  getBackendApiUrl,
} from "@/lib/api-client"

/**
 * Seller-dashboard bulk actions. The announcement endpoint returns a
 * DRAFT ONLY: nothing is sent and no record is created.
 */
export async function createAnnouncementDraftAction(formData: FormData) {
  const title = formData.get("title")
  const body = formData.get("body")
  const courseId = formData.get("courseId")
  if (typeof title !== "string" || title.trim().length < 2) {
    throw new Error("Announcement title is required.")
  }
  if (typeof body !== "string" || body.trim().length < 2) {
    throw new Error("Announcement body is required.")
  }
  const payload: Record<string, unknown> = {
    body: body.trim(),
    title: title.trim(),
  }
  if (typeof courseId === "string" && courseId.trim() !== "") {
    payload.courseId = courseId.trim()
  }
  return authenticatedApiFetch<AnnouncementDraftResponse>(
    "/instructor/seller-dashboard/announcement-draft",
    {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
}

/**
 * CSV download without a new route: the server action fetches the CSV
 * text from the backend and the client triggers the browser download as
 * seller-students.csv.
 */
export async function exportSellerStudentsAction() {
  const token = (await cookies()).get(accessTokenCookieName)?.value
  const response = await fetch(
    `${getBackendApiUrl()}/instructor/seller-dashboard/export`,
    {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )
  if (!response.ok) {
    throw new Error("Student export could not be downloaded.")
  }
  return { csv: await response.text() }
}
