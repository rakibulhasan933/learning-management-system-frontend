import Link from "next/link"
import { AlertCircle, ReceiptText } from "lucide-react"
import type { StudentOrderListResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { OrderStatusPill } from "@/components/status-pill"
import { formatPrice } from "@/lib/format"

export const dynamic = "force-dynamic"

const actionLink =
  "inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"

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

  const orders = response?.orders ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী · অর্ডার"
        lede="পেমেন্ট যাচাইকরণের অবস্থা ও এনরোলমেন্ট অ্যাক্সেস দেখুন।"
        title="অর্ডার ও পেমেন্ট"
      />

      {loadError ? (
        <p
          className="rounded-xl border border-destructive/40 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {loadError}
        </p>
      ) : orders.length === 0 ? (
        <EmptyState
          description="এনরোলমেন্ট শুরু করলেই এখানে অর্ডার দেখা যাবে।"
          icon={<ReceiptText />}
          title="এখনও কোনো এনরোলমেন্ট অর্ডার নেই"
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {orders.map((order) => (
            <li
              className="grid gap-4 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start"
              key={order.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg leading-[1.5] font-semibold">
                    {order.courseTitle}
                  </h2>
                  <OrderStatusPill status={order.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.referenceCode} ·{" "}
                  <span className="font-semibold text-foreground">
                    {formatPrice(order.amount, order.currency)}
                  </span>
                </p>
                {order.rejectionReason ? (
                  <p className="mt-2 flex gap-1.5 text-sm text-destructive">
                    <AlertCircle aria-hidden className="mt-1 size-4 shrink-0" />
                    {order.rejectionReason}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                {order.status === "rejected" ? (
                  <Link
                    className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    href={`/checkout/bkash?order_id=${order.id}`}
                  >
                    আবার পেমেন্ট যাচাই করুন
                  </Link>
                ) : null}
                <Link
                  className={actionLink}
                  href={`/dashboard/student/orders/${order.id}/instalments`}
                >
                  কিস্তি ও রিফান্ড অনুমান
                </Link>
                {order.status === "paid" ? (
                  <Link
                    className={actionLink}
                    href={`/dashboard/student/orders/${order.id}/refund`}
                  >
                    রিফান্ড রিকোয়েস্ট
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
