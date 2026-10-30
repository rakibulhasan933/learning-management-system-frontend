import Link from "next/link"
import { ArrowRight, BookOpen, CheckCircle2, Users } from "lucide-react"
import type { InstructorAnalyticsOverviewResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { StatTile } from "@/components/ui/stat-tile"
import { CourseStatusPill } from "@/components/status-pill"

export const dynamic = "force-dynamic"

export default async function InstructorDashboardPage() {
  const overview =
    await authenticatedApiFetch<InstructorAnalyticsOverviewResponse>(
      "/instructor/overview",
      { cache: "no-store" }
    )
  return (
    <div className="instructor-page instructor-overview-page space-y-8">
      <PageHeader
        className="text-left"
        eyebrow="ইন্সট্রাক্টর ড্যাশবোর্ড"
        lede="আপনার কোর্স, শিক্ষার্থী, শেখার অগ্রগতি ও কনটেন্ট এক জায়গা থেকে পরিচালনা করুন।"
        title="কোর্স পরিচালনা"
      />
      <div className="flex justify-start">
        <Button>
          <Link href="/dashboard/instructor/courses">কোর্স পরিচালনা করুন</Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={<BookOpen />}
          label="কোর্স"
          value={overview.totals.courseCount}
        />
        <StatTile
          icon={<Users />}
          label="সক্রিয় শিক্ষার্থী"
          value={overview.totals.activeEnrollmentCount}
        />
        <StatTile
          icon={<CheckCircle2 />}
          label="সম্পন্নের হার"
          value={`${overview.totals.completionRate}%`}
        />
      </div>
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              কোর্স ব্যবস্থাপনা
            </p>
            <h2 className="mt-2 font-heading text-2xl">আপনার কোর্সগুলো</h2>
          </div>
          <Button size="sm" variant="outline">
            <Link href="/dashboard/instructor/courses/new">
              নতুন কোর্স তৈরি করুন
            </Link>
          </Button>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {overview.courses.length === 0 ? (
            <EmptyState
              description="Create a draft to start building your first course."
              icon={<BookOpen />}
              title="এখনও কোনো কোর্স নেই"
            />
          ) : (
            overview.courses.map((course) => (
              <Card key={course.id}>
                <CardContent>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CourseStatusPill status={course.status} />
                      <h3 className="mt-3 font-heading text-2xl">
                        {course.title}
                      </h3>
                    </div>
                    <span className="font-mono text-sm text-primary">
                      {course.completionRate}%
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {course.activeEnrollmentCount} active students ·{" "}
                    {course.totalLectureCount} lectures
                  </p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <Button variant="outline">
                      <Link href={`/dashboard/instructor/courses/${course.id}`}>
                        কোর্স পরিচালনা
                      </Link>
                    </Button>
                    <Button variant="outline">
                      <Link
                        href={`/dashboard/instructor/courses/${course.id}/students`}
                      >
                        শিক্ষার্থী দেখুন <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
