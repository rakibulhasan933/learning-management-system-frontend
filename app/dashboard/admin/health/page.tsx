import { authenticatedApiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"

type Health = {
  failedUploads: number
  failedPayments: number
  unpublishedCourses: number
  emptyCourses: number
  storageUsage: string
  errorMonitoring: string
}
export const dynamic = "force-dynamic"
export default async function AdminHealthPage() {
  const health = await authenticatedApiFetch<Health>("/admin/health", {
    cache: "no-store",
  })
  const items = [
    ["Failed uploads", health.failedUploads],
    ["Failed payments", health.failedPayments],
    ["Unpublished courses", health.unpublishedCourses],
    ["Empty courses", health.emptyCourses],
  ] as const
  return (
    <>
      <PageHeader
        eyebrow="Admin dashboard · Operations"
        title="Platform health"
        lede="Quick operational signals for content, payments and storage integrations."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([label, value]) => (
          <Card key={label}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-3 font-mono text-3xl text-primary">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardContent>
          <h2 className="font-heading text-2xl">Integration status</h2>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <p>
              Storage usage:{" "}
              <span className="text-foreground">{health.storageUsage}</span>
            </p>
            <p>
              Error monitoring:{" "}
              <span className="text-foreground">{health.errorMonitoring}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
