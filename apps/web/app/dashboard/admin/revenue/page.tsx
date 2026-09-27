import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react"
import type { AdminRevenueOverviewResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { ProgressThread } from "@workspace/ui/components/progress-thread"

import { RevenueChart } from "../revenue-chart"

export const dynamic = "force-dynamic"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export default async function AdminRevenuePage() {
  const overview = await authenticatedApiFetch<AdminRevenueOverviewResponse>(
    "/admin/revenue",
    { cache: "no-store" },
  )

  const metrics = [
    {
      label: "Paid revenue",
      value: `৳ ${formatCurrency(overview.totals.paidRevenue)}`,
      icon: TrendingUp,
      tone: "gold" as const,
    },
    {
      label: "Paid orders",
      value: overview.totals.paidOrders.toString(),
      icon: ShoppingCart,
      tone: "default" as const,
    },
    {
      label: "Pending revenue",
      value: `৳ ${formatCurrency(overview.totals.pendingRevenue)}`,
      icon: Clock,
      tone: "warn" as const,
    },
    {
      label: "Pending payments",
      value: overview.totals.pendingOrders.toString(),
      icon: CreditCard,
      tone: "default" as const,
    },
    {
      label: "Active enrollments",
      value: overview.totals.activeEnrollments.toString(),
      icon: Users,
      tone: "default" as const,
    },
    {
      label: "Published courses",
      value: overview.totals.publishedCourses.toString(),
      icon: BookOpen,
      tone: "default" as const,
    },
  ]

  const methodTotal = overview.byMethod.reduce(
    (sum, m) => sum + m.revenue,
    0,
  )

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-10">
      <section className="mx-auto max-w-6xl">
        <ProgressThread className="mb-8" />
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs tracking-wide text-muted-foreground">
              Admin dashboard · Ledger
            </p>
            <h1 className="mt-3 font-heading text-4xl leading-[1.1] tracking-tight sm:text-5xl">
              Revenue overview
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Manual-payment revenue, order volume, and platform activity, as
              recorded today.
            </p>
          </div>
          <Button className="w-fit" variant="outline">
            <Link href="/dashboard/admin" className="flex items-center gap-2">
              <ArrowLeft className="size-3.5" />
              Dashboard
            </Link>
          </Button>
        </div>

        <dl className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(({ label, value, icon: Icon, tone }) => (
            <Card key={label} size="sm">
              <CardContent>
                <dt className="flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-muted-foreground">
                  <Icon
                    className={`size-3.5 ${
                      tone === "gold"
                        ? "text-primary"
                        : tone === "warn"
                          ? "text-primary"
                          : "text-muted-foreground"
                    }`}
                  />
                  {label}
                </dt>
                <dd
                  className={`mt-3 font-mono text-2xl tabular-nums ${
                    tone === "gold"
                      ? "text-primary"
                      : tone === "warn"
                        ? "text-primary"
                        : "text-foreground"
                  }`}
                >
                  {value}
                </dd>
              </CardContent>
            </Card>
          ))}
        </dl>

        <Card className="mt-5">
          <CardContent>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs tracking-wide text-muted-foreground">
                  Monthly paid revenue
                </p>
                <h2 className="mt-2 font-heading text-2xl tracking-tight">
                  Confirmed payments
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Confirmed payments recorded each month.
                </p>
              </div>
              <span className="font-mono text-xs tracking-wide text-muted-foreground">
                Last six months
              </span>
            </div>
            <RevenueChart data={overview.byMonth} />
          </CardContent>
        </Card>

        <Card className="mt-5">
          <CardContent>
            <p className="font-mono text-xs tracking-wide text-muted-foreground">
              Collection channels
            </p>
            <h2 className="mt-2 font-heading text-2xl tracking-tight">
              Revenue by payment method
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Share of paid revenue collected through each method.
            </p>

            <div className="mt-5 border-t border-border pt-5">
              {overview.byMethod.length === 0 ? (
                <p className="rounded-xl bg-background p-4 text-sm text-muted-foreground ring-1 ring-foreground/10">
                  No paid orders recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {overview.byMethod.map((method, index) => {
                    const share =
                      methodTotal > 0 ? (method.revenue / methodTotal) * 100 : 0

                    return (
                      <div
                        className="group relative rounded-xl bg-background px-4 py-4 ring-1 ring-foreground/10 transition-shadow duration-300 hover:ring-primary/40"
                        key={method.label}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                          <span className="flex items-center gap-2 text-sm text-foreground">
                            <span className="font-mono text-xs text-muted-foreground">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            {method.label}
                          </span>
                          <div className="flex items-baseline gap-4 font-mono text-sm tabular-nums">
                            <span className="text-primary">
                              ৳ {formatCurrency(method.revenue)}
                            </span>
                            <span className="text-muted-foreground">
                              {method.orders} order
                              {method.orders === 1 ? "" : "s"}
                            </span>
                            <span className="w-12 text-right text-muted-foreground">
                              {share.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <ProgressThread
                          className="mt-3 w-full"
                          value={share}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}