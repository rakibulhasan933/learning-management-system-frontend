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
  const response = await authenticatedApiFetch<StudentOrderListResponse>(
    "/payments/my-orders"
  )
  return (
    <>
      <PageHeader
        eyebrow="Student dashboard · Orders"
        lede="Track payment verification and enrollment access."
        title="Orders & payments"
      />
      <Card className="mt-10">
        <CardContent className="space-y-3">
          {response.orders.length === 0 ? (
            <EmptyState
              description="Orders appear here as soon as you start an enrollment."
              icon={<ReceiptText />}
              title="No enrollment orders yet"
            />
          ) : (
            response.orders.map((order) => (
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
    </>
  )
}
