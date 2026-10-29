"use server"

import { revalidatePath } from "next/cache"

import type { MessageSendResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"

/**
 * Send a text reply inside an existing 1:1 message thread.
 * The thread view is revalidated so the new message appears immediately.
 */
export async function sendMessageAction(
  threadId: string,
  threadPath: string,
  formData: FormData
) {
  const body = String(formData.get("body") ?? "").trim()

  if (!body) {
    throw new Error("মেসেজ খালি রাখা যাবে না।")
  }

  if (body.length > 2000) {
    throw new Error("মেসেজ সর্বোচ্চ ২০০০ অক্ষরের হতে পারে।")
  }

  await authenticatedApiFetch<MessageSendResponse>(
    `/messages/threads/${threadId}/messages`,
    {
      body: JSON.stringify({ body }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )

  revalidatePath(threadPath)
}
