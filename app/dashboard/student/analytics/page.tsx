import { Flame } from "lucide-react"
import type { ReactNode } from "react"
import type { StudentAnalyticsResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { formatDuration } from "@/lib/format"
import {
  QuizPerformanceChart,
  WeeklyActivityChart,
} from "../student-analytics-charts"

export const dynamic = "force-dynamic"

export default async function StudentAnalyticsPage() {
  const analytics =
    await authenticatedApiFetch<StudentAnalyticsResponse>("/student/analytics")
  return (
    <>
      <PageHeader
        eyebrow="Student dashboard · Analytics"
        lede="See your learning rhythm, course progress, and assessment performance."
        title="Learning analytics"
      />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label="Completion"
          note={`${analytics.completedLectures}/${analytics.totalLectures} lectures`}
          value={`${analytics.completionPercentage}%`}
        />
        <Metric
          label="Watch time"
          note="Saved learning time"
          value={formatDuration(analytics.watchTimeSeconds) ?? "0m"}
        />
        <Metric
          label="Quiz average"
          note={`${analytics.quizAttempts} attempts`}
          value={`${analytics.quizAveragePercentage}%`}
        />
        <Metric
          icon={<Flame className="size-5 text-primary" />}
          label="Streak"
          note="Active days"
          value={`${analytics.learningStreakDays}d`}
        />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
        <Card size="sm">
          <CardContent>
            <p className="font-mono text-xs text-muted-foreground">
              Last 7 days
            </p>
            <h2 className="mt-1 font-heading text-xl">
              Weekly learning activity
            </h2>
            <div className="mt-4">
              <WeeklyActivityChart data={analytics.weeklyActivity} />
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="font-mono text-xs text-muted-foreground">By course</p>
            <h2 className="mt-1 font-heading text-xl">Course progress</h2>
            <div className="mt-5 grid gap-4">
              {analytics.courses.map((course) => (
                <div key={course.courseId}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="truncate">{course.courseTitle}</span>
                    <span className="font-mono text-xs text-primary">
                      {course.completionPercentage}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${course.completionPercentage}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {course.completedLectures}/{course.totalLectures} lectures
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-5" size="sm">
        <CardContent>
          <p className="font-mono text-xs text-muted-foreground">
            Assessment results
          </p>
          <h2 className="mt-1 font-heading text-xl">Quiz performance</h2>
          {analytics.quizPerformance.length ? (
            <div className="mt-4">
              <QuizPerformanceChart data={analytics.quizPerformance} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Complete a quiz to see your scores.
            </p>
          )}
        </CardContent>
      </Card>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Metric
          label="Submitted"
          note="Assignments"
          value={`${analytics.assignmentsSubmitted}`}
        />
        <Metric
          label="Graded"
          note="Assignments"
          value={`${analytics.assignmentsGraded}`}
        />
        <Metric
          label="Pending"
          note="Assignments"
          value={`${analytics.assignmentsPending}`}
        />
      </div>
    </>
  )
}

function Metric({
  icon,
  label,
  note,
  value,
}: {
  icon?: ReactNode
  label: string
  note: string
  value: string
}) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </p>
        <p className="mt-2 font-mono text-2xl">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  )
}
