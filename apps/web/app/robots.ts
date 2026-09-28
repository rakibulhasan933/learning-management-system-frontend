import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://folio.example.com"

  return {
    host: baseUrl,
    rules: {
      allow: ["/", "/courses"],
      disallow: ["/dashboard/", "/learn/", "/auth/", "/checkout/", "/api/"],
      userAgent: "*",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
