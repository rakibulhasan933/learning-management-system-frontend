"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { authenticatedApiFetch } from "@/lib/api-client"

export async function createBundleAction(formData: FormData) {
  const title = formData.get("title")
  const price = Number(formData.get("price"))
  const originalPriceRaw = formData.get("originalPrice")
  const currencyRaw = formData.get("currency")
  const durationDaysRaw = formData.get("durationDays")
  const descriptionRaw = formData.get("description")
  const courseIds = formData
    .getAll("courseIds")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean)

  if (typeof title !== "string" || title.trim().length < 2) {
    throw new Error("Bundle title is required.")
  }
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Bundle price must be zero or more.")
  }
  if (courseIds.length === 0) {
    throw new Error("Pick at least one of your own courses.")
  }

  const body: Record<string, unknown> = {
    courseIds: [...new Set(courseIds)],
    price,
    title: title.trim(),
  }
  if (typeof originalPriceRaw === "string" && originalPriceRaw.trim() !== "") {
    body.originalPrice = Number(originalPriceRaw)
  }
  if (typeof currencyRaw === "string" && currencyRaw.trim() !== "") {
    body.currency = currencyRaw.trim()
  }
  if (typeof durationDaysRaw === "string" && durationDaysRaw.trim() !== "") {
    body.durationDays = Number(durationDaysRaw)
  }
  if (typeof descriptionRaw === "string" && descriptionRaw.trim() !== "") {
    body.description = descriptionRaw.trim()
  }

  await authenticatedApiFetch("/bundles", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  revalidatePath("/bundles")
  redirect("/bundles")
}
