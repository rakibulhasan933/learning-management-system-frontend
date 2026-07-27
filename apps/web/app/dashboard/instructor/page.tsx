import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Coins,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"
import type {
  InstructorAnalyticsOverviewResponse,
  InstructorPayoutListResponse,
} from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

function formatCurrency(value: number) {
  return `BDT ${value.toFixed(2)}`
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ")
}

const statusStyles: Record<string, string> = {
  pending: "border-muted-foreground/40 text-muted-foreground",
  approved: "border-secondary text-secondary",
  processing: "border-primary text-primary",
  paid: "border-secondary bg-secondary/10 text-secondary",
  rejected: "border-destructive text-destructive",
  failed: "border-destructive text-destructive",
}

function statusStyle(status: string) {
  return statusStyles[status] ?? "border-primary text-primary"
}

export default async function InstructorDashboardPage() {
  const [overview, payouts] = await Promise.all([
    authenticatedApiFetch<InstructorAnalyticsOverviewResponse>(
      "/instructor/overview",
      { cache: "no-store" },
    ),
    authenticatedApiFetch<InstructorPayoutListResponse>("/instructor/payouts", {
      cache: "no-store",
    }),
  ])

  const summaryCards = [
    {
      label: "Courses",
      value: overview.totals.courseCount.toString(),
      icon: BookOpen,
    },
    {
      label: "Active enrollments",
      value: overview.totals.activeEnrollmentCount.toString(),
      icon: Users,
    },
    {
      label: "Completion rate",
      value: `${overview.totals.completionRate}%`,
      icon: CheckCircle2,
    },
    {
      label: "Paid revenue",
      value: formatCurrency(overview.totals.revenue),
      icon: TrendingUp,
    },
    {
      label: "Available payout balance",
      value: formatCurrency(payouts.availableBalance),
      icon: Wallet,
    },
  ]

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <div
          id="analytics"
          className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="font-mono text-sm text-muted-foreground">
              Instructor dashboard
            </p>
            <h1 className="mt-3 font-heading text-3xl tracking-tight sm:text-4xl">
              Course operations
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track course performance, review enrolled students, and manage
              payout requests from one dark-first control surface.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/60 hover:text-primary"
              href="/dashboard/instructor/courses"
            >
              Manage courses
            </Link>
            <Link
              className="rounded-md border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
              href="/dashboard/instructor/payouts"
            >
              Payouts
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <div
              className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
              key={card.label}
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-muted-foreground">
                  {card.label}
                </p>
                <card.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="mt-3 font-heading text-2xl tabular-nums">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <section id="students" className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-sm text-muted-foreground">
                Course analytics
              </p>
              <h2 className="mt-2 font-heading text-2xl">Your courses</h2>
            </div>
            <span className="hidden font-mono text-xs text-muted-foreground sm:block">
              Revenue and completion are calculated from paid orders and active
              enrollments.
            </span>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {overview.courses.length === 0 ? (
              <div className="col-span-full rounded-lg border border-dashed border-border bg-card p-8 text-center">
                <ClipboardList className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No courses yet. Create a draft to start tracking analytics.
                </p>
              </div>
            ) : (
              overview.courses.map((course) => {
                const enrollmentRate =
                  course.enrollmentCount > 0
                    ? Math.round(
                        (course.activeEnrollmentCount / course.enrollmentCount) *
                          100,
                      )
                    : 0

                return (
                  <article
                    className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
                    key={course.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">
                          {statusLabel(course.status)} · {course.slug}
                        </p>
                        <h3 className="mt-2 font-heading text-2xl">
                          {course.title}
                        </h3>
                      </div>
                      <p className="font-mono text-sm text-primary tabular-nums">
                        {Number(course.price) === 0
                          ? "Free"
                          : `${course.currency} ${course.price}`}
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <div className="rounded-md border border-border bg-background p-3">
                        <p className="font-mono text-[11px] text-muted-foreground">
                          Enrollments
                        </p>
                        <p className="mt-2 text-lg tabular-nums">
                          {course.activeEnrollmentCount}/{course.enrollmentCount}
                        </p>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${enrollmentRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="rounded-md border border-border bg-background p-3">
                        <p className="font-mono text-[11px] text-muted-foreground">
                          Revenue
                        </p>
                        <p className="mt-2 text-lg tabular-nums">
                          {formatCurrency(course.revenue)}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-background p-3">
                        <p className="font-mono text-[11px] text-muted-foreground">
                          Completion
                        </p>
                        <p className="mt-2 text-lg tabular-nums">
                          {course.completionRate}%
                        </p>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                          <div
                            className="h-full rounded-full bg-secondary"
                            style={{ width: `${course.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <Link
                        className="rounded-md border border-border px-4 py-2 text-center text-sm text-foreground transition-colors hover:border-primary/60 hover:text-primary"
                        href={`/dashboard/instructor/courses/${course.id}/edit`}
                      >
                        Manage course
                      </Link>
                      <Link
                        className="rounded-md border border-primary px-4 py-2 text-center text-sm text-primary transition-colors hover:bg-primary/10"
                        href={`/dashboard/instructor/courses/${course.id}/students`}
                      >
                        View students
                      </Link>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </section>

        <section
          id="payouts"
          className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-sm text-muted-foreground">
                  Payout requests
                </p>
                <h2 className="mt-2 font-heading text-2xl">Recent activity</h2>
              </div>
              <Link
                className="inline-flex items-center gap-1.5 rounded-md border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
                href="/dashboard/instructor/payouts"
              >
                Request payout
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {payouts.payouts.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-6 text-center">
                  <Coins className="mx-auto h-5 w-5 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No payout requests yet. Your available balance is shown above.
                  </p>
                </div>
              ) : (
                payouts.payouts.slice(0, 5).map((payout) => (
                  <div
                    className="grid gap-3 rounded-md border border-border bg-background p-4 transition-colors hover:border-primary/30 md:grid-cols-[1fr_auto]"
                    key={payout.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm">{payout.referenceCode}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 font-mono text-[11px] ${statusStyle(payout.status)}`}
                        >
                          {statusLabel(payout.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {payout.note ?? "No note provided."}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="font-mono text-sm tabular-nums">
                        {payout.currency} {payout.amount}
                      </p>
                      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                        {new Date(payout.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <p className="font-mono text-sm text-muted-foreground">
              Payout balance
            </p>
            <h2 className="mt-2 font-heading text-2xl">Request your earnings</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Available balance is reserved against pending, approved, and paid
              requests. Submit a new payout only for funds that are still
              available.
            </p>
            <div className="mt-6 grid gap-3">
              <div className="rounded-md border border-border bg-background p-4">
                <p className="font-mono text-xs text-muted-foreground">
                  Available balance
                </p>
                <p className="mt-2 text-2xl text-primary tabular-nums">
                  {formatCurrency(payouts.availableBalance)}
                </p>
              </div>
              <div className="rounded-md border border-border bg-background p-4">
                <p className="font-mono text-xs text-muted-foreground">
                  Reserved amount
                </p>
                <p className="mt-2 text-2xl tabular-nums">
                  {formatCurrency(payouts.reservedAmount)}
                </p>
              </div>
            </div>
            <Link
              className="mt-5 inline-flex items-center gap-1.5 rounded-md border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
              href="/dashboard/instructor/payouts"
            >
              Open payout form
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}