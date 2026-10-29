import { Info } from "lucide-react"
import type { AdminRefundListResponse } from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { decideRefundAction } from "@/app/dashboard/admin/actions"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { SubmitButton } from "@/components/submit-button"
import { formatDateTime } from "@/lib/format"

export const dynamic = "force-dynamic"

const statusLabels: Record<string, string> = {
  requested: "অনুরোধ এসেছে",
  approved: "অনুমোদিত",
  rejected: "বাতিল",
  processed: "টাকা ফেরত সম্পন্ন",
}

export default async function AdminRefundsPage() {
  let refunds: AdminRefundListResponse["refunds"] = []
  let loadError: string | null = null
  try {
    const data = await authenticatedApiFetch<AdminRefundListResponse>(
      "/admin/refunds",
      { cache: "no-store" }
    )
    refunds = data.refunds ?? []
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "রিফান্ড তালিকা লোড করা যায়নি।"
  }

  return (
    <>
      <PageHeader
        eyebrow="অ্যাডমিন ড্যাশবোর্ড · পেমেন্ট"
        lede="রিফান্ড অনুরোধ পর্যালোচনা করুন, কারণ সংরক্ষণ করুন, আর এনরোলমেন্ট অ্যাক্সেসের সিদ্ধান্ত অডিটযোগ্য রাখুন।"
        title="রিফান্ড ব্যবস্থাপনা"
      />

      <Card className="mt-8 border-primary/30">
        <CardContent className="space-y-2">
          <div className="flex gap-3">
            <Info className="size-5 shrink-0 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              টাকা ফেরত সম্পূর্ণ ম্যানুয়াল (bKash send money-তে পাঠাতে হবে);
              সিস্টেম শুধু রেকর্ড রাখে, আসল টাকা মুভ করে না। অনুমোদন (Approve)
              করলে এনরোলমেন্ট স্বয়ংক্রিয়ভাবে রিভোক হয়ে যায় (backend করে) —
              টাকা পাঠানোর পর "Mark processed" দিয়ে রেকর্ড সম্পূর্ণ করুন।
            </p>
          </div>
        </CardContent>
      </Card>

      {loadError ? (
        <Card className="mt-8 border-destructive/40">
          <CardContent>
            <p className="text-sm text-destructive" role="alert">
              {loadError}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-8">
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="py-3">শিক্ষার্থী / কোর্স</th>
                    <th>টাকা</th>
                    <th>কারণ</th>
                    <th>পর্যালোচনা</th>
                    <th>অবস্থা</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((refund) => (
                    <tr className="border-b border-border/60" key={refund.id}>
                      <td className="py-4">
                        {refund.studentEmail}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {refund.courseTitle}
                        </span>
                        <br />
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatDateTime(refund.createdAt)}
                        </span>
                      </td>
                      <td>
                        {refund.currency} {refund.amount}
                      </td>
                      <td className="max-w-[220px]">{refund.reason}</td>
                      <td className="max-w-[220px] text-xs text-muted-foreground">
                        {refund.reviewedByEmail ? (
                          <>
                            {refund.reviewedByEmail}
                            <br />
                            {refund.reviewedAt
                              ? formatDateTime(refund.reviewedAt)
                              : null}
                            {refund.processedAt ? (
                              <>
                                <br />
                                প্রসেস: {formatDateTime(refund.processedAt)}
                              </>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{statusLabels[refund.status] ?? refund.status}</td>
                      <td>
                        {refund.status === "requested" ||
                        refund.status === "approved" ? (
                          <div className="flex gap-2">
                            <form action={decideRefundAction}>
                              <input
                                name="refundId"
                                type="hidden"
                                value={refund.id}
                              />
                              <input
                                name="action"
                                type="hidden"
                                value={
                                  refund.status === "requested"
                                    ? "approve"
                                    : "process"
                                }
                              />
                              <SubmitButton pendingLabel="..." variant="outline">
                                {refund.status === "requested"
                                  ? "অনুমোদন"
                                  : "প্রসেস সম্পন্ন"}
                              </SubmitButton>
                            </form>
                            <form action={decideRefundAction}>
                              <input
                                name="refundId"
                                type="hidden"
                                value={refund.id}
                              />
                              <input name="action" type="hidden" value="reject" />
                              <SubmitButton pendingLabel="..." variant="ghost">
                                বাতিল
                              </SubmitButton>
                            </form>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {refunds.length === 0 && (
                <p className="py-6 text-sm text-muted-foreground">
                  কোনো রিফান্ড অনুরোধ পাওয়া যায়নি।
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
