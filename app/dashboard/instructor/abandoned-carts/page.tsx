import type { AbandonedCartListResponse } from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { formatDateTime } from "@/lib/format"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"

export const dynamic = "force-dynamic"

export default async function InstructorAbandonedCartsPage() {
  let carts: AbandonedCartListResponse["carts"] = []
  let migrationPending = false
  let loadError: string | null = null
  try {
    const response = await authenticatedApiFetch<AbandonedCartListResponse>(
      "/instructor/abandoned-carts",
      { cache: "no-store" }
    )
    carts = response.carts
  } catch (error) {
    if (isMigrationPendingError(error)) {
      migrationPending = true
    } else {
      loadError = "Abandoned carts could not be loaded."
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ইন্সট্রাক্টর · বান্ডেল ও বিক্রি"
        lede="শুধুমাত্র আপনার কোর্স বা বান্ডেল থাকা অসম্পূর্ণ চেকআউটগুলো এখানে দেখা যায়। কোনো মার্কেটিং ইমেইল বা SMS এখান থেকে পাঠানো হয় না।"
        title="অসম্পূর্ণ কার্ট"
      />
      {migrationPending ? (
        <MigrationNotice feature="অসম্পূর্ণ কার্ট" />
      ) : loadError ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : carts.length === 0 ? (
        <EmptyState
          description="Carts abandoned before payment proof appear here, scoped to your courses."
          title="কোনো অসম্পূর্ণ কার্ট নেই"
        />
      ) : (
        <Card>
          <CardContent className="space-y-3">
            {carts.map((cart) => (
              <div
                className="rounded-xl border border-border p-4 text-sm"
                key={cart.id}
              >
                <p>
                  {cart.studentName ?? "নাম নেই"}
                  {cart.studentEmail ? ` · ${cart.studentEmail}` : ""}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  শুরু: {formatDateTime(cart.startedAt)} ·{" "}
                  {cart.recovered ? "পুনরুদ্ধার হয়েছে" : "পুনরুদ্ধার হয়নি"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  আইটেম:{" "}
                  {cart.items
                    .map(
                      (item) => item.courseId ?? item.bundleId ?? "অজানা আইটেম"
                    )
                    .join(", ")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
