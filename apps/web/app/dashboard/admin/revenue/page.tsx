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
    <main className="min-h-screen bg-[#0B0D0F] px-4 py-10 text-[#EDEEF0] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-6xl">
        {/* Masthead */}
        <div className="flex flex-col gap-6 border-b border-[#22262B] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#C9A24B]">
              Admin dashboard · Ledger
            </p>
            <h1 className="mt-3 text-3xl font-medium tracking-tight text-[#EDEEF0] sm:text-4xl">
              Revenue overview
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#8B929B]">
              Manual-payment revenue, order volume, and platform activity, as
              recorded today.
            </p>
          </div>
          <Link
            className="inline-flex w-fit items-center gap-2 border border-[#22262B] px-4 py-2 text-sm text-[#EDEEF0] transition-colors hover:border-[#C9A24B]/60 hover:text-[#C9A24B]"
            href="/dashboard/admin"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>

        {/* Metrics */}
        <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden border border-[#22262B] bg-[#22262B] sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(({ label, value, icon: Icon, tone }) => (
            <div className="bg-[#131619] p-5" key={label}>
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[#8B929B]">
                <Icon
                  className={`h-3.5 w-3.5 ${
                    tone === "gold"
                      ? "text-[#C9A24B]"
                      : tone === "warn"
                        ? "text-[#D9A441]"
                        : "text-[#8B929B]"
                  }`}
                />
                {label}
              </dt>
              <dd
                className={`mt-2 font-mono text-2xl ${
                  tone === "gold"
                    ? "text-[#C9A24B]"
                    : tone === "warn"
                      ? "text-[#D9A441]"
                      : "text-[#EDEEF0]"
                }`}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Monthly chart */}
        <section className="mt-6 border border-[#22262B] bg-[#131619] p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl text-[#EDEEF0] sm:text-2xl">
                Monthly paid revenue
              </h2>
              <p className="mt-1 text-sm text-[#8B929B]">
                Confirmed payments recorded each month.
              </p>
            </div>
            <span className="font-mono text-xs uppercase tracking-wide text-[#8B929B]">
              Last six months
            </span>
          </div>
          <RevenueChart data={overview.byMonth} />
        </section>

        {/* By payment method */}
        <section className="mt-6 border border-[#22262B] bg-[#131619] p-5">
          <h2 className="text-xl text-[#EDEEF0] sm:text-2xl">
            Revenue by payment method
          </h2>
          <p className="mt-1 text-sm text-[#8B929B]">
            Share of paid revenue collected through each method.
          </p>

          <div className="mt-5">
            {overview.byMethod.length === 0 ? (
              <p className="border border-[#22262B] bg-[#0E1013] p-4 text-sm text-[#8B929B]">
                No paid orders recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-[#22262B] border border-[#22262B]">
                {overview.byMethod.map((method, index) => {
                  const share =
                    methodTotal > 0 ? (method.revenue / methodTotal) * 100 : 0

                  return (
                    <div
                      className="group relative border-l-2 border-transparent bg-[#0E1013] px-4 py-4 transition-colors hover:border-[#C9A24B]"
                      key={method.label}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                        <span className="flex items-center gap-2 text-sm text-[#EDEEF0]">
                          <span className="font-mono text-xs text-[#8B929B]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {method.label}
                        </span>
                        <div className="flex items-baseline gap-4 font-mono text-sm">
                          <span className="text-[#C9A24B]">
                            ৳ {formatCurrency(method.revenue)}
                          </span>
                          <span className="text-[#8B929B]">
                            {method.orders} order
                            {method.orders === 1 ? "" : "s"}
                          </span>
                          <span className="w-12 text-right text-[#8B929B]">
                            {share.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 h-1 w-full bg-[#22262B]">
                        <div
                          className="h-1 bg-[#C9A24B]"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}