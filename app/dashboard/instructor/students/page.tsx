import type {
  InstructorAnalyticsOverviewResponse,
  InstructorCourseStudentsResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { formatDateTime } from "@/lib/format"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"

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
    <div className="instructor-page instructor-students-page space-y-8">
      <PageHeader
        eyebrow="ইন্সট্রাক্টর ড্যাশবোর্ড"
        lede="এনরোল করা শিক্ষার্থী, অগ্রগতি, এনরোলমেন্টের অবস্থা এবং সর্বশেষ কার্যক্রম দেখুন।"
        title="শিক্ষার্থীরা"
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
                  {response.metrics.completionRate}% গড় সম্পন্নের হার
                </p>
              </div>
              <div className="mt-5 grid gap-2">
                {response.students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    এখনও কোনো শিক্ষার্থী এনরোল করেনি।
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
                          : "এখনও কোনো কার্যক্রম নেই"}
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
