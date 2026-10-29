import Link from "next/link"
import { AlertCircle, ReceiptText } from "lucide-react"
import type { StudentOrderListResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { OrderStatusPill } from "@/components/status-pill"
import { formatPrice } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function StudentOrdersPage() {
  let response: StudentOrderListResponse | null = null
  let loadError: string | null = null
  try {
    response = await authenticatedApiFetch<StudentOrderListResponse>(
      "/payments/my-orders",
      { cache: "no-store" }
    )
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "অর্ডার লোড করা যায়নি।"
  }

  return (
    <>
      <PageHeader
        eyebrow="শিক্ষার্থী · অর্ডার"
        lede="পেমেন্ট যাচাইকরণের অবস্থা ও এনরোলমেন্ট অ্যাক্সেস দেখুন।"
        title="অর্ডার ও পেমেন্ট"
      />
      {loadError ? (
        <Card className="mt-8 border-destructive/40">
          <CardContent>
            <p className="text-sm text-destructive" role="alert">
              {loadError}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-10">
          <CardContent className="space-y-3">
            {response && response.orders.length === 0 ? (
              <EmptyState
                description="এনরোলমেন্ট শুরু করলেই এখানে অর্ডার দেখা যাবে।"
                icon={<ReceiptText />}
                title="এখনও কোনো এনরোলমেন্ট অর্ডার নেই"
              />
            ) : (
              (response?.orders ?? []).map((order) => (
                <div
                  className="grid gap-3 rounded-xl border border-border p-4 text-sm md:grid-cols-[minmax(0,1fr)_auto]"
                  key={order.id}
                >
                  <div>
                    <p className="text-base">{order.courseTitle}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {order.referenceCode} ·{" "}
                      {formatPrice(order.amount, order.currency)}
                    </p>
                    {order.rejectionReason ? (
                      <p className="mt-2 flex gap-1.5 text-destructive">
                        <AlertCircle className="size-4" />
                        {order.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <OrderStatusPill status={order.status} />
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/dashboard/student/orders/${order.id}/instalments`}
                      >
                        কিস্তি ও রিফান্ড অনুমান
                      </Link>
                    </Button>
                    {order.status === "paid" ? (
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/dashboard/student/orders/${order.id}/refund`}
                        >
                          রিফান্ড রিকোয়েস্ট
                        </Link>
                      </Button>
                    ) : null}
                    {order.status === "rejected" ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/checkout/bkash?order_id=${order.id}`}>
                          Verify payment again
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
