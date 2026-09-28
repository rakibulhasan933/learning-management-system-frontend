import type {
  InstructorAnalyticsOverviewResponse,
  InstructorCourseStudentsResponse,
} from "@workspace/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { formatDateTime } from "@/lib/format"
import { Card, CardContent } from "@workspace/ui/components/card"
import { PageHeader } from "@workspace/ui/components/page-header"

export const dynamic = "force-dynamic"

export default async function InstructorStudentsPage() {
  const overview =
    await authenticatedApiFetch<InstructorAnalyticsOverviewResponse>(
      "/instructor/overview",
      { cache: "no-store" }
    )
  const groups = await Promise.all(
    overview.courses.map(async (course) => ({
      course,
      response: await authenticatedApiFetch<InstructorCourseStudentsResponse>(
        `/instructor/courses/${course.id}/students`,
        { cache: "no-store" }
      ),
    }))
  )

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Instructor dashboard"
        lede="See enrolled students, progress, enrollment status, and last activity."
        title="Students"
      />
      <div className="grid gap-5">
        {groups.map(({ course, response }) => (
          <Card key={course.id}>
            <CardContent>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {response.students.length} students
                  </p>
                  <h2 className="mt-1 font-heading text-2xl">{course.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {response.metrics.completionRate}% average completion
                </p>
              </div>
              <div className="mt-5 grid gap-2">
                {response.students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No enrolled students yet.
                  </p>
                ) : (
                  response.students.map((student) => (
                    <div
                      className="grid gap-2 rounded-xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                      key={student.enrollmentId}
                    >
                      <div>
                        <p>{student.fullName ?? student.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.email}
                        </p>
                      </div>
                      <span className="font-mono text-sm text-primary">
                        {student.completionRate}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {student.lastWatchedAt
                          ? formatDateTime(student.lastWatchedAt)
                          : "No activity yet"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
