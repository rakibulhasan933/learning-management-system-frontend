import Link from "next/link"
import { PageHeader } from "@workspace/ui/components/page-header"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"

const reports = ["users", "courses", "payments", "revenue", "enrollments"]
export default function AdminReportsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin dashboard · Export"
        title="Reports export"
        lede="Download operational data as CSV for finance, support and reporting workflows."
      />
      <Card className="mt-8 max-w-2xl">
        <CardContent className="grid gap-3">
          {reports.map((report) => (
            <Button
              asChild
              className="justify-between"
              key={report}
              variant="outline"
            >
              <Link href={`/api/admin/reports/${report}`} download>
                {report.charAt(0).toUpperCase() + report.slice(1)} CSV{" "}
                <span>↓</span>
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </>
  )
}
