import type { ReactNode } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Flame,
  PlayCircle,
  Target,
} from "lucide-react"
import type {
  ProfileDto,
  StudentAnalyticsResponse,
  StudentOrderListResponse,
} from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { formatDuration } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"

export const dynamic = "force-dynamic"

export default async function StudentDashboardPage() {
  const [profile, analytics, orders] = await Promise.all([
    authenticatedApiFetch<ProfileDto>("/auth/me"),
    authenticatedApiFetch<StudentAnalyticsResponse>("/student/analytics"),
    authenticatedApiFetch<StudentOrderListResponse>("/payments/my-orders"),
  ])
  const activeCourse = orders.orders.find((order) => order.status === "paid")

  return (
    <div className="student-dashboard-page space-y-8">
      <PageHeader
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/student/classes">
              আমার ক্লাস দেখুন <ArrowRight />
            </Link>
          </Button>
        }
        className="text-left"
        eyebrow="শিক্ষার্থী ড্যাশবোর্ড"
        lede={`Welcome back, ${profile.fullName?.trim() || profile.email}. Your learning progress at a glance.`}
        title="আপনার শেখার সারাংশ"
      />

      <section
        aria-label="Learning summary"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <Metric
          label="সম্পন্ন"
          note={`${analytics.completedLectures}/${analytics.totalLectures} lectures`}
          value={`${analytics.completionPercentage}%`}
        />
        <Metric
          label="দেখার সময়"
          note="Across all classes"
          value={formatDuration(analytics.watchTimeSeconds) ?? "0m"}
        />
        <Metric
          label="কুইজ গড়"
          note={`${analytics.quizAttempts} attempts`}
          value={`${analytics.quizAveragePercentage}%`}
        />
        <Metric
          icon={<Flame className="size-4 text-primary" />}
          label="Streak"
          note="Active learning days"
          value={`${analytics.learningStreakDays}d`}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="overflow-hidden">
          <CardContent className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-primary" />
                <p className="font-mono text-xs text-muted-foreground">
                  শেখা চালিয়ে যান
                </p>
              </div>
              <h2 className="max-w-xl font-heading text-3xl font-normal tracking-tight sm:text-4xl">
                Pick up where you left off
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                আপনার লেকচার, মূল্যায়ন এবং কোর্সের উপকরণগুলো আমার ক্লাসে গুছিয়ে রাখা আছে।
              </p>
            </div>
            {activeCourse ? (
              <Button asChild className="w-fit">
                <Link href={`/learn/${activeCourse.courseId}`}>
                  <PlayCircle />
                  Continue {activeCourse.courseTitle}
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-fit">
                <Link href="/courses">
                  <BookOpen />
                  কোর্স দেখুন
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="size-4 text-primary" />
              <p className="font-mono text-xs text-muted-foreground">
                Quick access
              </p>
            </div>
            <div className="mt-6 grid gap-3">
              <QuickLink href="/dashboard/student/analytics">
                Open analytics
              </QuickLink>
              <QuickLink href="/dashboard/student/orders">
                View payment status
              </QuickLink>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Target className="size-4 text-primary" />
        <span>
          Keep a steady pace and return to your next unfinished lecture.
        </span>
      </div>
    </div>
  )
}

function QuickLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Button asChild className="justify-between" variant="outline">
      <Link href={href}>
        {children}
        <ArrowRight />
      </Link>
    </Button>
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
      <CardContent className="p-4 sm:p-5">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </p>
        <p className="mt-3 font-mono text-2xl text-foreground sm:text-3xl">
          {value}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  )
}
