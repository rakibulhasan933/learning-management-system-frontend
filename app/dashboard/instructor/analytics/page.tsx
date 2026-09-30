import type { InstructorAnalyticsOverviewResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { StatTile } from "@/components/ui/stat-tile"

export const dynamic = "force-dynamic"

export default async function InstructorAnalyticsPage() {
  const overview =
    await authenticatedApiFetch<InstructorAnalyticsOverviewResponse>(
      "/instructor/overview",
      { cache: "no-store" }
    )
  return (
    <div className="instructor-page instructor-analytics-page space-y-8">
      <PageHeader
        eyebrow="ইন্সট্রাক্টর ড্যাশবোর্ড"
        lede="এনরোলমেন্ট, সম্পন্নের হার এবং কোর্সের শেখার ফলাফল বিশ্লেষণ করুন।"
        title="অ্যানালিটিক্স"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="সক্রিয় শিক্ষার্থী"
          value={overview.totals.activeEnrollmentCount}
        />
        <StatTile
          label="সম্পন্নের হার"
          value={`${overview.totals.completionRate}%`}
        />
        <StatTile label="কোর্স" value={overview.totals.courseCount} />
      </div>
      <Card>
        <CardContent>
          <h2 className="font-heading text-2xl">কোর্সের ফলাফল</h2>
          <div className="mt-5 grid gap-3">
            {overview.courses.map((course) => (
              <div
                className="grid gap-2 rounded-xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                key={course.id}
              >
                <div>
                  <p>{course.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {course.enrollmentCount} এনরোলমেন্ট ·{" "}
                    {course.totalLectureCount} টি লেকচার
                  </p>
                </div>
                <span className="font-mono text-sm text-primary">
                  {course.completionRate}% সম্পন্ন
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
