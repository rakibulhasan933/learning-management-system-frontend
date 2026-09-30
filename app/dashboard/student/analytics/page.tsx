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
    <div className="student-analytics-page">
      <PageHeader
        eyebrow="শিক্ষার্থী ড্যাশবোর্ড · অ্যানালিটিক্স"
        lede="আপনার শেখার ছন্দ, কোর্সের অগ্রগতি এবং মূল্যায়নের ফলাফল দেখুন।"
        title="শেখার অগ্রগতি"
      />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label="সম্পন্ন"
          note={`${analytics.completedLectures}/${analytics.totalLectures}টি লেকচার`}
          value={`${analytics.completionPercentage}%`}
        />
        <Metric
          label="দেখার সময়"
          note="শেখার মোট সময়"
          value={formatDuration(analytics.watchTimeSeconds) ?? "0m"}
        />
        <Metric
          label="কুইজের গড়"
          note={`${analytics.quizAttempts}টি চেষ্টা`}
          value={`${analytics.quizAveragePercentage}%`}
        />
        <Metric
          icon={<Flame className="size-5 text-primary" />}
          label="শেখার ধারাবাহিকতা"
          note="সক্রিয় শেখার দিন"
          value={`${analytics.learningStreakDays}d`}
        />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
        <Card size="sm">
          <CardContent>
            <p className="font-mono text-xs text-muted-foreground">
              গত ৭ দিন
            </p>
            <h2 className="mt-1 font-heading text-xl">
              সাপ্তাহিক শেখার কার্যক্রম
            </h2>
            <div className="mt-4">
              <WeeklyActivityChart data={analytics.weeklyActivity} />
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="font-mono text-xs text-muted-foreground">কোর্স অনুযায়ী</p>
            <h2 className="mt-1 font-heading text-xl">কোর্সের অগ্রগতি</h2>
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
                    {course.completedLectures}/{course.totalLectures}টি লেকচার
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
            মূল্যায়নের ফলাফল
          </p>
          <h2 className="mt-1 font-heading text-xl">কুইজের ফলাফল</h2>
          {analytics.quizPerformance.length ? (
            <div className="mt-4">
              <QuizPerformanceChart data={analytics.quizPerformance} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              আপনার স্কোর দেখতে একটি কুইজ সম্পন্ন করুন।
            </p>
          )}
        </CardContent>
      </Card>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Metric
          label="জমা দেওয়া"
          note="অ্যাসাইনমেন্ট"
          value={`${analytics.assignmentsSubmitted}`}
        />
        <Metric
          label="মূল্যায়িত"
          note="অ্যাসাইনমেন্ট"
          value={`${analytics.assignmentsGraded}`}
        />
        <Metric
          label="অপেক্ষমাণ"
          note="অ্যাসাইনমেন্ট"
          value={`${analytics.assignmentsPending}`}
        />
      </div>
    </div>
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
