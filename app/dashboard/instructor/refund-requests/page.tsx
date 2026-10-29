import { Info, ReceiptText } from "lucide-react"
import type { InstructorRefundRequestListResponse } from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency, formatDateTime } from "@/lib/format"

export const dynamic = "force-dynamic"

const statusLabels: Record<string, string> = {
  requested: "অনুরোধ এসেছে",
  approved: "অনুমোদিত",
  rejected: "বাতিল",
  processed: "টাকা ফেরত সম্পন্ন",
}

/**
 * Read-only list of refund requests for the instructor's own courses.
 * Decisions (approve/reject/process) are made by admins only.
 */
export default async function InstructorRefundRequestsPage() {
  let requests: InstructorRefundRequestListResponse["requests"] = []
  let loadError: string | null = null
  try {
    const data =
      await authenticatedApiFetch<InstructorRefundRequestListResponse>(
        "/instructor/refund-requests",
        { cache: "no-store" }
      )
    requests = data.refunds ?? []
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "রিফান্ড তালিকা লোড করা যায়নি।"
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ইন্সট্রাক্টর · রিফান্ড"
        lede="শুধুমাত্র আপনার নিজের কোর্সের রিফান্ড রিকোয়েস্ট দেখা যাচ্ছে। অনুমোদন বা বাতিলের সিদ্ধান্ত নেন অ্যাডমিন।"
        title="রিফান্ড রিকোয়েস্ট"
      />

      <Card className="border-primary/30">
        <CardContent className="flex gap-3">
          <Info className="size-5 shrink-0 text-primary" />
          <p className="text-sm leading-6 text-muted-foreground">
            এই তালিকা শুধু দেখার জন্য — এখানে কোনো সিদ্ধান্ত নেওয়া যায় না।
            টাকা ফেরত ম্যানুয়াল (bKash send money-তে পাঠানো হয়); সিস্টেম শুধু
            রেকর্ড রাখে।
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
      ) : requests.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              description="আপনার কোর্সের জন্য কোনো রিফান্ড রিকোয়েস্ট এলে এখানে দেখা যাবে।"
              icon={<ReceiptText />}
              title="কোনো রিফান্ড রিকোয়েস্ট নেই"
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="py-3">শিক্ষার্থী</th>
                    <th>কোর্স</th>
                    <th>টাকা</th>
                    <th>কারণ</th>
                    <th>অবস্থা</th>
                    <th>তারিখ</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr
                      className="border-b border-border/60"
                      key={request.id}
                    >
                      <td className="py-4">{request.studentName}</td>
                      <td>{request.courseTitle}</td>
                      <td className="font-mono tabular-nums">
                        {formatCurrency(request.amount, request.currency)}
                      </td>
                      <td className="max-w-[240px]">{request.reason}</td>
                      <td>{statusLabels[request.status] ?? request.status}</td>
                      <td className="font-mono text-xs text-muted-foreground">
                        {formatDateTime(request.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
