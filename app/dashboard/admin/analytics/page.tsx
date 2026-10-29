import Link from "next/link"
import { Download, Info } from "lucide-react"
import type {
  AnalyticsCohortsResponse,
  AnalyticsFunnelResponse,
  AnalyticsRefundReasonsResponse,
  AnalyticsTeachersResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

import { RatingStars } from "@/app/courses/[slug]/reviews-section"

export const dynamic = "force-dynamic"

type ReportName = "funnel" | "cohorts" | "refund-reasons" | "teachers"

function ExportButton({ report, label }: { report: ReportName; label: string }) {
  return (
    <Button asChild size="sm" variant="outline">
      <Link download href={`/api/admin/analytics/${report}`}>
        <Download className="size-4" />
        {label}
      </Link>
    </Button>
  )
}

function SectionError({ message }: { message: string }) {
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  )
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return `${value.toFixed(1)}%`
}

export default async function AdminAnalyticsPage() {
  let funnel: AnalyticsFunnelResponse | null = null
  let funnelError: string | null = null
  let cohorts: AnalyticsCohortsResponse | null = null
  let cohortsError: string | null = null
  let refundReasons: AnalyticsRefundReasonsResponse | null = null
  let refundReasonsError: string | null = null
  let teachers: AnalyticsTeachersResponse | null = null
  let teachersError: string | null = null

  try {
    funnel = await authenticatedApiFetch<AnalyticsFunnelResponse>(
      "/admin/analytics/funnel",
      { cache: "no-store" }
    )
  } catch (error) {
    funnelError = error instanceof Error ? error.message : "ফানেল লোড করা যায়নি।"
  }
  try {
    cohorts = await authenticatedApiFetch<AnalyticsCohortsResponse>(
      "/admin/analytics/cohorts",
      { cache: "no-store" }
    )
  } catch (error) {
    cohortsError =
      error instanceof Error ? error.message : "কোহর্ট লোড করা যায়নি।"
  }
  try {
    refundReasons =
      await authenticatedApiFetch<AnalyticsRefundReasonsResponse>(
        "/admin/analytics/refund-reasons",
        { cache: "no-store" }
      )
  } catch (error) {
    refundReasonsError =
      error instanceof Error ? error.message : "রিফান্ড কারণ লোড করা যায়নি।"
  }
  try {
    teachers = await authenticatedApiFetch<AnalyticsTeachersResponse>(
      "/admin/analytics/teachers",
      { cache: "no-store" }
    )
  } catch (error) {
    teachersError =
      error instanceof Error ? error.message : "শিক্ষক র‍্যাংকিং লোড করা যায়নি।"
  }

  const funnelSteps: AnalyticsFunnelStepDto[] = funnel
    ? [
        { key: "signups", label: "সাইনআপ", count: funnel.signups },
        {
          key: "paid",
          label: "পেইড অর্ডার",
          count: funnel.paidOrders,
          conversionRate: funnel.signupToPaidPct / 100,
        },
        {
          key: "completed",
          label: "কোর্স সম্পন্ন",
          count: funnel.completedCourses,
          conversionRate: funnel.paidToCompletedPct / 100,
        },
      ]
    : []

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="অ্যাডমিন ড্যাশবোর্ড · অ্যানালিটিক্স"
        lede="সাইনআপ থেকে এনরোলমেন্ট পর্যন্ত ফানেল, মাসভিত্তিক কোহর্ট, রিফান্ডের কারণ, আর শিক্ষকদের পারফরম্যান্স — সবই আসল ডেটা থেকে।"
        title="অ্যাডভান্সড অ্যানালিটিক্স"
      />

      {/* Funnel */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl">সাইনআপ → এনরোলমেন্ট ফানেল</h2>
            <ExportButton label="ফানেল CSV" report="funnel" />
          </div>
          <div className="flex gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
            <Info className="size-4 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              ভিজিট ট্র্যাক করা হয় না, সাইনআপ থেকে শুরু। প্রতিটি ধাপের
              কনভার্সন % আগের ধাপের তুলনায় হিসাব করা।
            </p>
          </div>
          {funnelError ? (
            <SectionError message={funnelError} />
          ) : funnelSteps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              ফানেলের কোনো তথ্য পাওয়া যায়নি।
            </p>
          ) : (
            <div className="space-y-2">
              {funnelSteps.map((step, index) => {
                const previous = index > 0 ? funnelSteps[index - 1] : null
                const conversion =
                  step.conversionRate !== null &&
                  step.conversionRate !== undefined
                    ? step.conversionRate * 100
                    : previous && previous.count > 0
                      ? (step.count / previous.count) * 100
                      : null
                return (
                  <div
                    className="grid gap-2 rounded-xl border border-border p-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                    key={step.key}
                  >
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        ধাপ {index + 1}
                      </p>
                      <p className="mt-1 text-base">{step.label}</p>
                    </div>
                    <p className="font-mono text-lg tabular-nums">
                      {step.count.toLocaleString("en-US")}
                    </p>
                    <p className="font-mono text-sm text-primary tabular-nums">
                      {index === 0
                        ? "—"
                        : conversion === null
                          ? "—"
                          : `${conversion.toFixed(1)}%`}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cohorts */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl">মাসভিত্তিক কোহর্ট</h2>
            <ExportButton label="কোহর্ট CSV" report="cohorts" />
          </div>
          {cohortsError ? (
            <SectionError message={cohortsError} />
          ) : (cohorts?.cohorts ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              কোহর্টের কোনো তথ্য পাওয়া যায়নি।
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="py-3">মাস</th>
                    <th>এনরোলড</th>
                    <th>সম্পন্ন %</th>
                    <th>রিফান্ড %</th>
                  </tr>
                </thead>
                <tbody>
                  {(cohorts?.cohorts ?? []).map((cohort) => (
                    <tr className="border-b border-border/60" key={cohort.month}>
                      <td className="py-4 font-mono">{cohort.month}</td>
                      <td className="font-mono tabular-nums">
                        {cohort.enrolled.toLocaleString("en-US")}
                      </td>
                      <td className="font-mono tabular-nums">
                        {formatPercent(cohort.completedPct)}
                      </td>
                      <td className="font-mono tabular-nums">
                        {formatPercent(cohort.refundPct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund reasons */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl">রিফান্ডের কারণ</h2>
            <ExportButton label="কারণ CSV" report="refund-reasons" />
          </div>
          {refundReasonsError ? (
            <SectionError message={refundReasonsError} />
          ) : (refundReasons?.reasons ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              রিফান্ডের কারণের কোনো তথ্য পাওয়া যায়নি।
            </p>
          ) : (
            <div className="space-y-2">
              {(refundReasons?.reasons ?? []).map((item) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 text-sm"
                  key={item.reason}
                >
                  <p>{item.reason}</p>
                  <p className="font-mono tabular-nums">
                    {item.count.toLocaleString("en-US")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teachers */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl">শিক্ষক র‍্যাংকিং</h2>
            <ExportButton label="র‍্যাংকিং CSV" report="teachers" />
          </div>
          {teachersError ? (
            <SectionError message={teachersError} />
          ) : (teachers?.teachers ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              শিক্ষক র‍্যাংকিংয়ের কোনো তথ্য পাওয়া যায়নি।
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="py-3">শিক্ষক</th>
                    <th>বিক্রি</th>
                    <th>সম্পন্ন %</th>
                    <th>গড় রেটিং</th>
                    <th>রিফান্ড %</th>
                  </tr>
                </thead>
                <tbody>
                  {(teachers?.teachers ?? []).map((teacher) => (
                    <tr
                      className="border-b border-border/60"
                      key={teacher.teacherId}
                    >
                      <td className="py-4">
                        {teacher.teacherName}
                        {teacher.courseCount !== null &&
                        teacher.courseCount !== undefined ? (
                          <>
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {teacher.courseCount}টি কোর্স
                            </span>
                          </>
                        ) : null}
                      </td>
                      <td className="font-mono tabular-nums">
                        {formatCurrency(teacher.sales)}
                      </td>
                      <td className="font-mono tabular-nums">
                        {formatPercent(teacher.completionPct)}
                      </td>
                      <td>
                        {teacher.avgRating !== null &&
                        teacher.avgRating !== undefined ? (
                          <span className="flex items-center gap-2">
                            <RatingStars rating={teacher.avgRating} />
                            <span className="font-mono text-xs tabular-nums">
                              {teacher.avgRating.toFixed(1)}
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="font-mono tabular-nums">
                        {formatPercent(teacher.refundPct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
