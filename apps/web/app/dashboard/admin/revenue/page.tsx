import Link from "next/link"
import type { AdminRevenueOverviewResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

import { RevenueChart } from "../revenue-chart"

export const dynamic = "force-dynamic"

function formatCurrency(value: number) {
  return `BDT ${value.toFixed(2)}`
}

export default async function AdminRevenuePage() {
  const overview = await authenticatedApiFetch<AdminRevenueOverviewResponse>(
    "/admin/revenue",
    { cache: "no-store" },
  )

  const metrics = [
    ["Paid revenue", formatCurrency(overview.totals.paidRevenue)],
    ["Paid orders", overview.totals.paidOrders.toString()],
    ["Pending revenue", formatCurrency(overview.totals.pendingRevenue)],
    ["Pending payments", overview.totals.pendingOrders.toString()],
    ["Active enrollments", overview.totals.activeEnrollments.toString()],
    ["Published courses", overview.totals.publishedCourses.toString()],
  ]

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Admin dashboard
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl tracking-tight">Revenue overview</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track manual-payment revenue, order volume, and platform activity.
            </p>
          </div>
          <Link
            className="border border-border px-4 py-2 text-sm text-foreground"
            href="/dashboard/admin"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {metrics.map(([label, value]) => (
            <div className="border border-border bg-card p-5" key={label}>
              <p className="font-mono text-xs text-muted-foreground">{label}</p>
              <p className="mt-3 text-2xl">{value}</p>
            </div>
          ))}
        </div>

        <section className="mt-6 border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl">Monthly paid revenue</h2>
            <span className="font-mono text-xs text-muted-foreground">
              Last six months
            </span>
          </div>
          <RevenueChart data={overview.byMonth} />
        </section>

        <section className="mt-6 border border-border bg-card p-5">
          <h2 className="text-2xl">Revenue by payment method</h2>
          <div className="mt-5 grid gap-3">
            {overview.byMethod.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No paid orders recorded yet.
              </p>
            ) : (
              overview.byMethod.map((method) => (
                <div
                  className="grid gap-2 border border-border bg-background p-3 md:grid-cols-[1fr_160px_120px]"
                  key={method.label}
                >
                  <span>{method.label}</span>
                  <span className="font-mono text-primary">
                    {formatCurrency(method.revenue)}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {method.orders} orders
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  )
}
