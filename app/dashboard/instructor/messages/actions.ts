"use server"

import type { MessageBroadcastResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"

/**
 * Instructor broadcasts a text message to every student of one of their
 * courses or batches. The backend creates one thread per recipient.
 * Returns the counts so the form can show a summary. No redirect — the
 * instructor stays on the broadcast page to send another message.
 */
export async function broadcastMessageAction(
  formData: FormData
): Promise<MessageBroadcastResponse> {
  const target = String(formData.get("target") ?? "")
  const courseId = String(formData.get("courseId") ?? "").trim()
  const batchId = String(formData.get("batchId") ?? "").trim()
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

  const payload: {
    courseId?: string
    batchId?: string
    subject: string
    body: string
  } = {
    body,
    subject,
  }

  if (target === "batch") {
    if (!batchId) {
      throw new Error("একটি ব্যাচ বেছে নিন।")
    }

    payload.batchId = batchId
  } else {
    if (!courseId) {
      throw new Error("একটি কোর্স বেছে নিন।")
    }

    payload.courseId = courseId
  }

  return authenticatedApiFetch<MessageBroadcastResponse>(
    "/instructor/messages/broadcast",
    {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
}
