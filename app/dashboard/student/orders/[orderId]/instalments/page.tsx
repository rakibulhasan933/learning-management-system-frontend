import type {
  InstalmentScheduleResponse,
  RefundEstimateResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
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

const panel = "rounded-xl border border-border bg-card"
const summaryCls =
  "flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-semibold [&::-webkit-details-marker]:hidden"

// Unknown statuses fall back to the raw value.
const instalmentStatus: Record<string, string> = {
  pending: "বাকি",
  paid: "পরিশোধিত",
  overdue: "মেয়াদ পেরিয়েছে",
  partial: "আংশিক",
}

function Toggle() {
  return (
    <span aria-hidden className="text-2xl leading-none text-primary">
      <span className="group-open:hidden">+</span>
      <span className="hidden group-open:inline">–</span>
    </span>
  )
}

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

  const remaining =
    schedule && schedule.orderAmount !== null
      ? Math.max(Number(schedule.orderAmount) - Number(schedule.paidTotal), 0)
      : null

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী · কিস্তি"
        lede="প্রথম কিস্তি পরিশোধ হলেই অ্যাক্সেস চালু হবে। পরের কিস্তি দেরি হলে মেয়াদ-পেরোনো দেখাবে, কিন্তু অ্যাক্সেস কখনও বাতিল হবে না।"
        title="কিস্তি ও রিফান্ড অনুমান"
      />

      {schedulePending ? (
        <MigrationNotice feature="কিস্তি" />
      ) : (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">কিস্তির সময়সূচি</h2>
          {schedule?.accessRule ? (
            <p className="text-sm text-muted-foreground">
              {schedule.accessRule}
            </p>
          ) : null}

          {schedule ? (
            <>
              <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border text-center sm:text-left">
                {[
                  [
                    "অর্ডার মোট",
                    schedule.orderAmount !== null
                      ? formatCurrency(schedule.orderAmount)
                      : "—",
                  ],
                  ["পরিশোধিত", formatCurrency(schedule.paidTotal)],
                  [
                    "বাকি",
                    remaining !== null ? formatCurrency(remaining) : "—",
                  ],
                ].map(([label, value]) => (
                  <div className="bg-card p-4 sm:p-5" key={label}>
                    <dd className="text-lg font-semibold tabular-nums sm:text-2xl">
                      {value}
                    </dd>
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                  </div>
                ))}
              </dl>

              {schedule.instalments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  এখনও কোনো কিস্তি নির্ধারণ করা হয়নি।
                </p>
              ) : (
                <ol className="divide-y divide-border rounded-xl border border-border bg-card">
                  {schedule.instalments.map((instalment, index) => (
                    <li className="p-5" key={instalment.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p>
                          <span className="text-sm text-muted-foreground">
                            কিস্তি {(index + 1).toLocaleString("bn-BD")} ·{" "}
                          </span>
                          <strong className="text-lg">
                            {formatCurrency(instalment.amount)}
                          </strong>
                        </p>
                        <span
                          className={`text-sm font-medium ${
                            instalment.status === "overdue"
                              ? "text-destructive"
                              : instalment.status === "paid"
                                ? "text-foreground"
                                : "text-muted-foreground"
                          }`}
                        >
                          {instalmentStatus[instalment.status] ??
                            instalment.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        শেষ তারিখ {formatDateTime(instalment.dueDate)}
                        {instalment.status === "paid" && instalment.paidAt
                          ? ` · পরিশোধ ${formatDateTime(instalment.paidAt)}`
                          : ""}
                      </p>
                      {instalment.status !== "paid" ? (
                        <PayInstalmentForm
                          instalmentId={instalment.id}
                          orderId={orderId}
                        />
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              সময়সূচি লোড করা যায়নি।
            </p>
          )}

          <details className={`${panel} group`}>
            <summary className={summaryCls}>
              কিস্তি নির্ধারণ বা পুনর্নির্ধারণ
              <Toggle />
            </summary>
            <div className="space-y-3 border-t border-border p-5">
              <p className="text-sm text-muted-foreground">
                ২–১২টি কিস্তি, যোগফল অর্ডারের মোটের সমান হতে হবে। আংশিক পরিশোধিত
                কিস্তি থাকলে পুনর্নির্ধারণ করা যাবে না।
              </p>
              <DefineInstalmentsForm
                orderAmount={schedule?.orderAmount ?? null}
                orderId={orderId}
              />
            </div>
          </details>
        </section>
      )}

      <details className={`${panel} group`}>
        <summary className={summaryCls}>
          অর্ডারে আরেকটি কোর্স যোগ করুন
          <Toggle />
        </summary>
        <div className="space-y-3 border-t border-border p-5">
          <p className="text-sm text-muted-foreground">
            Pending অর্ডারে আরেকটি কোর্স যোগ করুন, অর্ডারের মোট আপডেট হবে।
          </p>
          <OrderBumpForm orderId={orderId} />
        </div>
      </details>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">রিফান্ড অনুমান</h2>
        {!estimate ? (
          <p className="text-sm text-muted-foreground">
            রিফান্ড অনুমান লোড করা যায়নি।
          </p>
        ) : (
          <div className={`${panel} space-y-3 p-5`}>
            <dl className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">ধরন</dt>
                <dd className="font-semibold">{estimate.kind}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">যোগ্য</dt>
                <dd className="font-semibold">
                  {estimate.eligible ? "হ্যাঁ" : "না"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">আনুমানিক অঙ্ক</dt>
                <dd className="font-semibold">
                  {estimate.estimatedAmount !== null
                    ? formatCurrency(estimate.estimatedAmount)
                    : "—"}
                </dd>
              </div>
            </dl>
            <p className="text-sm text-muted-foreground">{estimate.rule}</p>
            <p className="border-t border-border pt-3 text-sm font-medium">
              এটি শুধু একটি অনুমান, স্বয়ংক্রিয় রিফান্ডের প্রতিশ্রুতি নয়। আসল
              রিফান্ড এখনও বিদ্যমান অ্যাডমিন ফ্লোতেই হবে।
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
