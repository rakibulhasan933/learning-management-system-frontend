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
    <div className="space-y-8">
      <PageHeader
        className="text-left"
        eyebrow="Instructor dashboard"
        lede="Manage your courses, students, learning progress, and content from separate workspaces."
        title="Course operations"
      />
      <div className="flex justify-start">
        <Button asChild>
          <Link href="/dashboard/instructor/courses">Manage courses</Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={<BookOpen />}
          label="Courses"
          value={overview.totals.courseCount}
        />
        <StatTile
          icon={<Users />}
          label="Active students"
          value={overview.totals.activeEnrollmentCount}
        />
        <StatTile
          icon={<CheckCircle2 />}
          label="Completion rate"
          value={`${overview.totals.completionRate}%`}
        />
      </div>
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              Course management
            </p>
            <h2 className="mt-2 font-heading text-2xl">Your courses</h2>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/instructor/courses/new">Create course</Link>
          </Button>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {overview.courses.length === 0 ? (
            <EmptyState
              description="Create a draft to start building your first course."
              icon={<BookOpen />}
              title="No courses yet"
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
                    <Button asChild variant="outline">
                      <Link href={`/dashboard/instructor/courses/${course.id}`}>
                        Manage course
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link
                        href={`/dashboard/instructor/courses/${course.id}/students`}
                      >
                        View students <ArrowRight />
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
