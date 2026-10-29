"use server"

import { redirect } from "next/navigation"

import type { MessageThreadCreateResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"

/**
 * Student opens a new 1:1 thread with the instructor of a course they are
 * enrolled in. The backend resolves the instructor from the course.
 */
export async function createMessageThreadAction(
  courseId: string,
  formData: FormData
) {
  const subject = String(formData.get("subject") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()

  if (!subject) {
    throw new Error("বিষয় লিখতে হবে।")
  }

  if (!body) {
    throw new Error("মেসেজ খালি রাখা যাবে না।")
  }

  if (body.length > 2000) {
    throw new Error("মেসেজ সর্বোচ্চ ২০০০ অক্ষরের হতে পারে।")
  }

  const response = await authenticatedApiFetch<MessageThreadCreateResponse>(
    "/messages/threads",
    {
      body: JSON.stringify({ body, courseId, subject }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )

  redirect(`/dashboard/student/messages/${response.thread.id}`)
}
