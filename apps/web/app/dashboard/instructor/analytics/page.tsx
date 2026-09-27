import type { InstructorAnalyticsOverviewResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@workspace/ui/components/card"
import { PageHeader } from "@workspace/ui/components/page-header"
import { StatTile } from "@workspace/ui/components/stat-tile"

export const dynamic = "force-dynamic"

export default async function InstructorAnalyticsPage() {
  const overview = await authenticatedApiFetch<InstructorAnalyticsOverviewResponse>("/instructor/overview", { cache: "no-store" })
  return <div className="space-y-8"><PageHeader eyebrow="Instructor dashboard" lede="Track enrollment, completion, and course learning performance." title="Analytics" /><div className="grid gap-3 sm:grid-cols-3"><StatTile label="Active students" value={overview.totals.activeEnrollmentCount} /><StatTile label="Completion rate" value={`${overview.totals.completionRate}%`} /><StatTile label="Courses" value={overview.totals.courseCount} /></div><Card><CardContent><h2 className="font-heading text-2xl">Course performance</h2><div className="mt-5 grid gap-3">{overview.courses.map((course) => <div className="grid gap-2 rounded-xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" key={course.id}><div><p>{course.title}</p><p className="mt-1 text-xs text-muted-foreground">{course.enrollmentCount} enrollments · {course.totalLectureCount} lectures</p></div><span className="font-mono text-sm text-primary">{course.completionRate}% complete</span></div>)}</div></CardContent></Card></div>
}
