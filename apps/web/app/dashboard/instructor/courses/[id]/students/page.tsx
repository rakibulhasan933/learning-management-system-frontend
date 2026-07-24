import Link from "next/link"
import type { InstructorCourseStudentsResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

function formatCurrency(value: number) {
  return `BDT ${value.toFixed(2)}`
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ")
}

interface InstructorCourseStudentsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function InstructorCourseStudentsPage({
  params,
}: InstructorCourseStudentsPageProps) {
  const { id } = await params
  const response = await authenticatedApiFetch<InstructorCourseStudentsResponse>(
    `/instructor/courses/${id}/students`,
    { cache: "no-store" },
  )

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-sm text-muted-foreground">
              Instructor dashboard
            </p>
            <h1 className="mt-3 text-4xl tracking-tight">{response.course.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              Student roster, enrollment status, and completion progress for this
              course.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="border border-border px-4 py-2 text-sm text-foreground"
              href="/dashboard/instructor"
            >
              Back to dashboard
            </Link>
            <Link
              className="border border-primary px-4 py-2 text-sm text-primary"
              href={`/dashboard/instructor/courses/${response.course.id}/edit`}
            >
              Manage course
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">
              Enrollments
            </p>
            <p className="mt-3 text-2xl">{response.metrics.enrollmentCount}</p>
          </div>
          <div className="border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">
              Active
            </p>
            <p className="mt-3 text-2xl">{response.metrics.activeEnrollmentCount}</p>
          </div>
          <div className="border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">
              Completed
            </p>
            <p className="mt-3 text-2xl">
              {response.metrics.completedEnrollmentCount}
            </p>
          </div>
          <div className="border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">
              Completion rate
            </p>
            <p className="mt-3 text-2xl">{response.metrics.completionRate}%</p>
          </div>
          <div className="border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">Revenue</p>
            <p className="mt-3 text-2xl">
              {formatCurrency(response.metrics.revenue)}
            </p>
          </div>
          <div className="border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">
              Lectures
            </p>
            <p className="mt-3 text-2xl">{response.metrics.totalLectureCount}</p>
          </div>
        </div>

        <section className="mt-8 border border-border bg-card p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-sm text-muted-foreground">
                Student list
              </p>
              <h2 className="mt-2 text-2xl">Enrolled students</h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {response.students.length} rows
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-3 font-normal">Student</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Progress</th>
                  <th className="px-4 py-3 font-normal">Completion</th>
                  <th className="px-4 py-3 font-normal">Last watched</th>
                  <th className="px-4 py-3 font-normal">Completed at</th>
                  <th className="px-4 py-3 font-normal">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {response.students.length === 0 ? (
                  <tr>
                    <td className="px-4 py-5 text-muted-foreground" colSpan={7}>
                      No enrolled students yet.
                    </td>
                  </tr>
                ) : (
                  response.students.map((student) => (
                    <tr className="border-b border-border" key={student.enrollmentId}>
                      <td className="px-4 py-3">
                        <div className="font-mono">{student.email}</div>
                        <div className="text-muted-foreground">
                          {student.fullName ?? "No name"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="border border-primary px-2 py-1 font-mono text-[11px] text-primary">
                          {statusLabel(student.enrollmentStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {student.completedLectureCount}/{student.totalLectureCount}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono">{student.completionRate}%</div>
                        <div className="text-muted-foreground">
                          {student.isCompleted ? "Completed" : "In progress"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {student.lastWatchedAt
                          ? new Date(student.lastWatchedAt).toLocaleString()
                          : "No progress yet"}
                      </td>
                      <td className="px-4 py-3">
                        {student.completedAt
                          ? new Date(student.completedAt).toLocaleString()
                          : "Not completed"}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(student.enrolledAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}
