import { Info } from "lucide-react"

import type {
  StudentOrderListResponse,
  StudentRefundRequestListResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency, formatDateTime } from "@/lib/format"

import { RefundRequestForm } from "./refund-request-client"

export const dynamic = "force-dynamic"

const statusLabels: Record<string, string> = {
  requested: "অনুরোধ পাঠানো হয়েছে",
  approved: "অনুমোদিত",
  rejected: "বাতিল",
  processed: "টাকা ফেরত প্রসেস করা হয়েছে",
}

export default async function OrderRefundPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params

  let order = null as
    | StudentOrderListResponse["orders"][number]
    | null
  let requests: StudentRefundRequestListResponse["requests"] = []
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী · রিফান্ড"
        lede="রিফান্ড রিকোয়েস্ট পাঠান এবং আপনার অনুরোধের স্ট্যাটাস দেখুন।"
        title="রিফান্ড রিকোয়েস্ট"
      />

      <Card className="border-primary/30">
        <CardContent className="flex gap-3">
          <Info className="size-5 shrink-0 text-primary" />
          <p className="text-sm leading-6 text-muted-foreground">
            টাকা ফেরত ম্যানুয়াল (bKash send money-তে পাঠানো হবে); সিস্টেম শুধু
            রেকর্ড রাখে, আসল টাকা মুভ করে না। অনুমোদন পেলে অ্যাডমিন নিজে টাকা
            পাঠিয়ে রেকর্ড আপডেট করবেন, আর এনরোলমেন্ট বাতিল হয়ে যাবে।
          </p>
        </CardContent>
      </Card>

      {loadError ? (
        <Card className="border-destructive/40">
          <CardContent>
            <p className="text-sm text-destructive" role="alert">
              {loadError}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {order ? (
            <Card>
              <CardContent className="space-y-1">
                <h2 className="font-heading text-xl">অর্ডারের তথ্য</h2>
                <p className="text-sm">
                  {order.courseTitle} ·{" "}
                  {formatCurrency(order.amount, order.currency)} · অর্ডার অবস্থা:{" "}
                  {order.status}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent>
              <h2 className="mb-4 font-heading text-xl">
                নতুন রিফান্ড রিকোয়েস্ট
              </h2>
              <RefundRequestForm orderId={orderId} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <h2 className="font-heading text-xl">আপনার রিকোয়েস্টসমূহ</h2>
              {ownRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  এই অর্ডারের জন্য এখনও কোনো রিফান্ড রিকোয়েস্ট নেই।
                </p>
              ) : (
                ownRequests.map((request) => (
                  <div
                    className="rounded-xl border border-border p-4 text-sm"
                    key={request.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {statusLabels[request.status] ?? request.status}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {formatDateTime(request.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 text-muted-foreground">
                      {request.courseTitle ?? "কোর্স"} ·{" "}
                      {formatCurrency(request.amount, request.currency)}
                    </p>
                    <p className="mt-1 leading-6">{request.reason}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
