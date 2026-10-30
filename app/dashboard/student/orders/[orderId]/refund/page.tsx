import { Info } from "lucide-react"

import type {
  StudentOrderListResponse,
  StudentRefundRequestListResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/ui/page-header"
import { OrderStatusPill } from "@/components/status-pill"
import { formatCurrency, formatDateTime } from "@/lib/format"

import { RefundRequestForm } from "./refund-request-client"

export const dynamic = "force-dynamic"

const statusLabels: Record<string, string> = {
  requested: "অনুরোধ পাঠানো হয়েছে",
  approved: "অনুমোদিত",
  rejected: "বাতিল",
  processed: "টাকা ফেরত প্রসেস করা হয়েছে",
}

const panel = "rounded-xl border border-border bg-card p-5 sm:p-6"

export default async function OrderRefundPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params

  let order = null as StudentOrderListResponse["orders"][number] | null
  let requests: StudentRefundRequestListResponse["refunds"] = []
  let loadError: string | null = null

  try {
    const orders = await authenticatedApiFetch<StudentOrderListResponse>(
      "/payments/my-orders",
      { cache: "no-store" }
    )
    order = orders.orders.find((item) => item.id === orderId) ?? null
  } catch (error) {
    loadError = error instanceof Error ? error.message : "তথ্য লোড করা যায়নি।"
  }

  try {
    const data = await authenticatedApiFetch<StudentRefundRequestListResponse>(
      "/refund-requests",
      { cache: "no-store" }
    )
    requests = data.refunds ?? []
  } catch {
    requests = []
  }

  const ownRequests = requests.filter((request) => request.orderId === orderId)

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী · রিফান্ড"
        lede="রিফান্ড রিকোয়েস্ট পাঠান এবং আপনার অনুরোধের স্ট্যাটাস দেখুন।"
        title="রিফান্ড রিকোয়েস্ট"
      />

      <p className="flex gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
        <Info aria-hidden className="mt-1 size-4 shrink-0 text-primary" />
        <span>
          টাকা ফেরত ম্যানুয়াল (bKash send money-তে পাঠানো হবে)। সিস্টেম শুধু
          রেকর্ড রাখে, আসল টাকা মুভ করে না। অনুমোদন পেলে অ্যাডমিন নিজে টাকা
          পাঠিয়ে রেকর্ড আপডেট করবেন, আর এনরোলমেন্ট বাতিল হয়ে যাবে।
        </span>
      </p>

      {loadError ? (
        <p
          className="rounded-xl border border-destructive/40 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {loadError}
        </p>
      ) : (
        <>
          {order ? (
            <section
              className={`${panel} flex flex-wrap items-center justify-between gap-3`}
            >
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">অর্ডার</p>
                <p className="text-lg leading-[1.5] font-semibold">
                  {order.courseTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(order.amount, order.currency)}
                </p>
              </div>
              <OrderStatusPill status={order.status} />
            </section>
          ) : null}

          <section className={panel}>
            <h2 className="mb-4 text-xl font-semibold">
              নতুন রিফান্ড রিকোয়েস্ট
            </h2>
            <RefundRequestForm orderId={orderId} />
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">আপনার রিকোয়েস্টসমূহ</h2>
            {ownRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                এই অর্ডারের জন্য এখনও কোনো রিফান্ড রিকোয়েস্ট নেই।
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                {ownRequests.map((request) => (
                  <li className="p-5 text-sm" key={request.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">
                        {statusLabels[request.status] ?? request.status}
                      </p>
                      <p className="text-muted-foreground">
                        {formatDateTime(request.createdAt)}
                      </p>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {request.courseTitle ?? "কোর্স"} ·{" "}
                      {formatCurrency(request.amount, request.currency)}
                    </p>
                    <p className="mt-2 leading-6">{request.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
