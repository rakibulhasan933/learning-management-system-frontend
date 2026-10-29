import type {
  InstalmentScheduleResponse,
  RefundEstimateResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency, formatDateTime } from "@/lib/format"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"

import {
  DefineInstalmentsForm,
  OrderBumpForm,
  PayInstalmentForm,
} from "./instalment-client"

export const dynamic = "force-dynamic"

export default async function OrderInstalmentsPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  let schedule: InstalmentScheduleResponse | null = null
  let schedulePending = false
  let estimate: RefundEstimateResponse | null = null

  try {
    schedule = await authenticatedApiFetch<InstalmentScheduleResponse>(
      `/orders/${orderId}/instalments`,
      { cache: "no-store" }
    )
  } catch (error) {
    if (isMigrationPendingError(error)) schedulePending = true
  }
  try {
    estimate = await authenticatedApiFetch<RefundEstimateResponse>(
      `/orders/${orderId}/refund-estimate`,
      { cache: "no-store" }
    )
  } catch {
    estimate = null
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী · কিস্তি"
        lede="প্রথম কিস্তি পরিশোধ হলেই অ্যাক্সেস চালু হবে। পরের কিস্তি দেরি হলে overdue দেখাবে, কিন্তু অ্যাক্সেস কখনও বাতিল হবে না।"
        title="কিস্তি ও রিফান্ড অনুমান"
      />

      {schedulePending ? (
        <MigrationNotice feature="কিস্তি" />
      ) : (
        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-heading text-xl">কিস্তির সময়সূচি</h2>
            {schedule?.accessRule ? (
              <p className="text-sm text-muted-foreground">
                {schedule.accessRule}
              </p>
            ) : null}
            {schedule ? (
              <>
                <p className="text-sm">
                  অর্ডার মোট:{" "}
                  {schedule.orderAmount !== null
                    ? formatCurrency(schedule.orderAmount)
                    : "—"}{" "}
                  · পরিশোধিত: {formatCurrency(schedule.paidTotal)}
                </p>
                {schedule.instalments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    এখনও কোনো কিস্তি নির্ধারণ করা হয়নি।
                  </p>
                ) : (
                  schedule.instalments.map((instalment) => (
                    <div
                      className="rounded-xl border border-border p-4 text-sm"
                      key={instalment.id}
                    >
                      <p>
                        {formatCurrency(instalment.amount)} · শেষ তারিখ{" "}
                        {formatDateTime(instalment.dueDate)} · অবস্থা:{" "}
                        {instalment.status}
                      </p>
                      {instalment.status !== "paid" ? (
                        <PayInstalmentForm
                          instalmentId={instalment.id}
                          orderId={orderId}
                        />
                      ) : (
                        <p className="mt-1 text-muted-foreground">
                          পরিশোধিত
                          {instalment.paidAt
                            ? ` · ${formatDateTime(instalment.paidAt)}`
                            : ""}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                সময়সূচি লোড করা যায়নি।
              </p>
            )}
            <div className="border-t border-border pt-4">
              <h3 className="font-medium">কিস্তি নির্ধারণ / পুনর্নির্ধারণ</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                ২–১২টি কিস্তি, যোগফল অর্ডারের মোটের সমান হতে হবে। আংশিক
                পরিশোধিত কিস্তি থাকলে পুনর্নির্ধারণ করা যাবে না।
              </p>
              <div className="mt-3">
                <DefineInstalmentsForm
                  orderAmount={schedule?.orderAmount ?? null}
                  orderId={orderId}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-3">
          <h2 className="font-heading text-xl">অর্ডার-বাম্প (upsell)</h2>
          <p className="text-sm text-muted-foreground">
            Pending অর্ডারে আরেকটি কোর্স যোগ করুন; অর্ডারের মোট আপডেট হবে।
          </p>
          <OrderBumpForm orderId={orderId} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <h2 className="font-heading text-xl">রিফান্ড অনুমান (শুধু অনুমান)</h2>
          {!estimate ? (
            <p className="text-sm text-muted-foreground">
              রিফান্ড অনুমান লোড করা যায়নি।
            </p>
          ) : (
            <>
              <p className="text-sm">
                ধরন: {estimate.kind} · যোগ্য: {estimate.eligible ? "হ্যাঁ" : "না"} ·
                আনুমানিক অঙ্ক:{" "}
                {estimate.estimatedAmount !== null
                  ? formatCurrency(estimate.estimatedAmount)
                  : "—"}
              </p>
              <p className="text-sm text-muted-foreground">{estimate.rule}</p>
              <p className="text-sm font-medium">
                এটি শুধু একটি অনুমান, স্বয়ংক্রিয় রিফান্ডের প্রতিশ্রুতি নয়।
                আসল রিফান্ড এখনও বিদ্যমান অ্যাডমিন ফ্লোতেই হবে।
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
