"use server"

import { revalidatePath } from "next/cache"
import { authenticatedApiFetch } from "@/lib/api-client"

export async function createDiscussionPostAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "")
  const body = String(formData.get("body") ?? "").trim()
  const parentId = String(formData.get("parentId") ?? "").trim() || null
  if (!courseId || body.length < 2)
    throw new Error("Discussion message is required.")
  await authenticatedApiFetch(`/community/courses/${courseId}/discussions`, {
    body: JSON.stringify({ body, parentId }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  revalidatePath(`/learn/${courseId}`)
}
