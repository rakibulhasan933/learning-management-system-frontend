import Link from "next/link"
import { ArrowRight, BookOpen, PlayCircle } from "lucide-react"
import type {
  ProfileDto,
  StudentAnalyticsResponse,
  StudentOrderListResponse,
} from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { formatDuration } from "@/lib/format"
import { PageHeader } from "@/components/ui/page-header"

export const dynamic = "force-dynamic"

const bn = (n: number) => n.toLocaleString("bn-BD")

const btnPrimary =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-fit"

export default async function StudentDashboardPage() {
  const [profile, analytics, orders] = await Promise.all([
    authenticatedApiFetch<ProfileDto>("/auth/me"),
    authenticatedApiFetch<StudentAnalyticsResponse>("/student/analytics"),
    authenticatedApiFetch<StudentOrderListResponse>("/payments/my-orders"),
  ])
  const activeCourse = orders.orders.find((order) => order.status === "paid")
  const percent = Math.min(Math.max(analytics.completionPercentage, 0), 100)

  const stats = [
    {
      label: "সম্পন্ন",
      value: `${bn(analytics.completionPercentage)}%`,
      note: `${bn(analytics.completedLectures)}/${bn(analytics.totalLectures)}টি লেকচার`,
    },
    {
      label: "দেখার সময়",
      value: formatDuration(analytics.watchTimeSeconds) ?? "০ মিনিট",
      note: "সব ক্লাস মিলিয়ে",
    },
    {
      label: "কুইজ গড়",
      value: `${bn(analytics.quizAveragePercentage)}%`,
      note: `${bn(analytics.quizAttempts)}টি চেষ্টা`,
    },
    {
      label: "শেখার ধারাবাহিকতা",
      value: `${bn(analytics.learningStreakDays)} দিন`,
      note: "সক্রিয় শেখার দিন",
    },
  ]

  const links = [
    ["/dashboard/student/classes", "আমার ক্লাস"],
    ["/dashboard/student/model-tests", "মডেল টেস্ট"],
    ["/dashboard/student/analytics", "অ্যানালিটিক্স দেখুন"],
    ["/dashboard/student/orders", "পেমেন্টের অবস্থা দেখুন"],
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        className="text-left"
        eyebrow="শিক্ষার্থী ড্যাশবোর্ড"
        lede={`স্বাগতম, ${profile.fullName?.trim() || profile.email}। এক নজরে আপনার শেখার অগ্রগতি দেখুন।`}
        title="আপনার শেখার সারাংশ"
      />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col justify-between gap-8 rounded-xl border border-border bg-card p-6 sm:p-8">
          <div>
            <p className="text-sm text-muted-foreground">
              {activeCourse ? "যেখানে থেমেছিলেন" : "শুরু করার জন্য"}
            </p>
            <h2 className="mt-2 max-w-xl text-2xl leading-[1.5] font-semibold text-balance sm:text-3xl">
              {activeCourse
                ? activeCourse.courseTitle
                : "আপনার প্রথম কোর্স বেছে নিন"}
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {activeCourse
                ? "লেকচার, মূল্যায়ন ও কোর্সের উপকরণ আমার ক্লাসে গুছিয়ে রাখা আছে।"
                : "পেমেন্ট যাচাই হলেই কোর্স এখানে দেখা যাবে।"}
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted-foreground">মোট অগ্রগতি</span>
                <span className="font-semibold tabular-nums">
                  {bn(analytics.completionPercentage)}%
                </span>
              </div>
              <div
                aria-label="মোট অগ্রগতি"
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={percent}
                className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {activeCourse ? (
              <Link
                className={btnPrimary}
                href={`/learn/${activeCourse.courseId}`}
              >
                <PlayCircle aria-hidden className="size-5" />
                চালিয়ে যান
              </Link>
            ) : (
              <Link className={btnPrimary} href="/courses">
                <BookOpen aria-hidden className="size-5" />
                কোর্স দেখুন
              </Link>
            )}
          </div>
        </div>

        <nav
          aria-label="দ্রুত অ্যাক্সেস"
          className="rounded-xl border border-border bg-card"
        >
          <p className="px-5 pt-5 pb-2 text-sm text-muted-foreground">
            দ্রুত অ্যাক্সেস
          </p>
          <ul className="px-2 pb-2">
            {links.map(([href, label]) => (
              <li key={href}>
                <Link
                  className="flex min-h-12 items-center justify-between gap-3 rounded-lg px-3 transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-primary"
                  href={href}
                >
                  {label}
                  <ArrowRight
                    aria-hidden
                    className="size-4 text-muted-foreground"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <section
        aria-label="শেখার সারাংশ"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <div className="bg-card p-5" key={stat.label}>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {stat.note}
            </p>
          </div>
        ))}
      </section>
    </div>
  )
}
