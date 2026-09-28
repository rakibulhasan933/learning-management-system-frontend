import type { AdminRefundListResponse } from "@workspace/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { decideRefundAction } from "@/app/dashboard/admin/actions"
import { PageHeader } from "@workspace/ui/components/page-header"
import { Card, CardContent } from "@workspace/ui/components/card"
import { SubmitButton } from "@/components/submit-button"

export const dynamic = "force-dynamic"
export default async function AdminRefundsPage() {
  const { refunds } = await authenticatedApiFetch<AdminRefundListResponse>(
    "/admin/refunds",
    { cache: "no-store" }
  )
  return (
    <>
      <PageHeader
        eyebrow="Admin dashboard · Payments"
        title="Refund and reversal management"
        lede="Review refund requests, preserve the reason, and keep enrollment access decisions auditable."
      />
      <Card className="mt-8">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-3">Student/course</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
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
                    </td>
                    <td>
                      {refund.currency} {refund.amount}
                    </td>
                    <td className="max-w-[220px]">{refund.reason}</td>
                    <td className="capitalize">{refund.status}</td>
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
                                ? "Approve"
                                : "Mark processed"}
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
                              Reject
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
                No refunds found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
