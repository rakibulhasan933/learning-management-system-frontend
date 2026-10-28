import type { MetadataRoute } from "next"

import { publicApiFetch } from "@/lib/api-client"
import type { CourseListResponse } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://folio.example.com"
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/courses`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
  ]

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return staticRoutes
  }

  try {
    const response = await publicApiFetch<CourseListResponse>(
      "/courses?page=1&pageSize=100"
    )
    return staticRoutes.concat(
      response.courses.map((course) => ({
        url: `${baseUrl}/courses/${course.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
    )
  } catch {
    return staticRoutes
  }
}
