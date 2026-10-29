"use server"

import { revalidatePath } from "next/cache"

import { authenticatedApiFetch } from "@/lib/api-client"

/** Student creates a review for a course. Star rating is mandatory (1–5). */
export async function createCourseReviewAction(
  courseId: string,
  slug: string,
  formData: FormData
) {
  const rating = Number(formData.get("rating"))
  const body = String(formData.get("body") ?? "").trim()

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("রিভিউ জমা দিতে স্টার রেটিং (১–৫) আবশ্যক।")
  }

  await authenticatedApiFetch(`/courses/${courseId}/reviews`, {
    body: JSON.stringify({ rating, body: body || undefined }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  revalidatePath(`/courses/${slug}`)
}

/** Instructor/admin replies to a review. Backend enforces course ownership for instructors. */
export async function replyToReviewAction(
  reviewId: string,
  slug: string,
  formData: FormData
) {
  const body = String(formData.get("body") ?? "").trim()

  if (!body) {
    throw new Error("উত্তরের লেখা খালি রাখা যাবে না।")
  }

  await authenticatedApiFetch(`/reviews/${reviewId}/replies`, {
    body: JSON.stringify({ body }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  revalidatePath(`/courses/${slug}`)
}

/** Admin hides (or unhides) a review. There is no delete endpoint by design. */
export async function setReviewVisibilityAction(
  reviewId: string,
  slug: string,
  hidden: boolean
) {
  await authenticatedApiFetch(`/reviews/${reviewId}/visibility`, {
    body: JSON.stringify({ hidden }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  revalidatePath(`/courses/${slug}`)
}
/** Student edits their own review. Star rating stays mandatory. */
export async function updateCourseReviewAction(
  courseId: string,
  slug: string,
  formData: FormData
) {
  const rating = Number(formData.get("rating"))
  const body = String(formData.get("body") ?? "").trim()

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("রিভিউ আপডেট করতে স্টার রেটিং (১–৫) আবশ্যক।")
  }

  await authenticatedApiFetch(`/courses/${courseId}/reviews`, {
    body: JSON.stringify({ rating, body: body || undefined }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  })
  revalidatePath(`/courses/${slug}`)
}
