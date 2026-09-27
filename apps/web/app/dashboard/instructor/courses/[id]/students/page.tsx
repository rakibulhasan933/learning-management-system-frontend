import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react"
import type { InstructorCourseStudentsResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { PageHeader } from "@workspace/ui/components/page-header"
import { ProgressThread } from "@workspace/ui/components/progress-thread"
import { StatTile } from "@workspace/ui/components/stat-tile"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { EnrollmentStatusPill } from "@/components/status-pill"
import { formatDate } from "@/lib/format"

export const dynamic = "force-dynamic"

interface InstructorCourseStudentsPageProps {
  params: Promise<{
    id: string
  }>
}

/** Both the stacked and tabulated views render from this one shape. */
interface StudentRow {
  id: string
  email: string
  name: string
  status: string
  completedLectures: number
  totalLectures: number
  completionRate: number
  lastWatched: string
  completedAt: string
  enrolled: string
}

export default async function InstructorCourseStudentsPage({
  params,
}: InstructorCourseStudentsPageProps) {
  const { id } = await params
  const response = await authenticatedApiFetch<InstructorCourseStudentsResponse>(
    `/instructor/courses/${id}/students`,
    { cache: "no-store" },
  )

  const metrics = [
    {
      icon: <Users />,
      label: "Enrollments",
      value: response.metrics.enrollmentCount,
    },
    {
      icon: <UserCheck />,
      label: "Active",
      value: response.metrics.activeEnrollmentCount,
    },
    {
      icon: <CheckCircle2 />,
      label: "Completed",
      value: response.metrics.completedEnrollmentCount,
    },
    {
      icon: <TrendingUp />,
      label: "Completion rate",
      meter: response.metrics.completionRate,
      value: `${response.metrics.completionRate}%`,
    },
    {
      icon: <BookOpen />,
      label: "Lectures",
      value: response.metrics.totalLectureCount,
    },
  ]

  const rows: StudentRow[] = response.students.map((student) => ({
    id: student.enrollmentId,
    email: student.email,
    name: student.fullName ?? "No name",
    status: student.enrollmentStatus,
    completedLectures: student.completedLectureCount,
    totalLectures: student.totalLectureCount,
    completionRate: student.completionRate,
    lastWatched: student.lastWatchedAt
      ? formatDate(student.lastWatchedAt)
      : "No progress yet",
    completedAt: student.completedAt
      ? formatDate(student.completedAt)
      : "Not completed",
    enrolled: formatDate(student.enrolledAt),
  }))

  return (
    <>
      <PageHeader
        eyebrow="Instructor dashboard"
        lede="Student roster, enrollment status, and completion progress for this course."
        title={response.course.title}
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href="/dashboard/instructor">
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/dashboard/instructor/courses/${response.course.id}/edit`}>
            Manage course
          </Link>
        </Button>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => (
          <StatTile
            icon={metric.icon}
            key={metric.label}
            label={metric.label}
            meter={metric.meter}
            value={metric.value}
          />
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-wide text-muted-foreground">
                Student list
              </p>
              <h2 className="mt-2 font-heading text-2xl tracking-tight">
                Enrolled students
              </h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {rows.length} {rows.length === 1 ? "student" : "students"}
            </span>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              description="Students appear here once an enrollment is activated."
              icon={<Users />}
              title="No enrolled students yet"
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-48">Progress</TableHead>
                      <TableHead>Last watched</TableHead>
                      <TableHead>Completed at</TableHead>
                      <TableHead>Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="py-4">
                          <div className="font-mono">{row.email}</div>
                          <div className="mt-1 text-muted-foreground">
                            {row.name}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <EnrollmentStatusPill status={row.status} />
                        </TableCell>
                        <TableCell className="w-48 py-4">
                          <Progress row={row} />
                        </TableCell>
                        <TableCell className="py-4 text-muted-foreground">
                          {row.lastWatched}
                        </TableCell>
                        <TableCell className="py-4 text-muted-foreground">
                          {row.completedAt}
                        </TableCell>
                        <TableCell className="py-4 text-muted-foreground">
                          {row.enrolled}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function Progress({ row }: { row: StudentRow }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-mono tabular-nums">
          {row.completedLectures}/{row.totalLectures}
        </span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {row.completionRate}%
        </span>
      </div>
      <ProgressThread className="mt-2 w-full" value={row.completionRate} />
    </div>
  )
}
