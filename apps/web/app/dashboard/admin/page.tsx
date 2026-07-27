import Link from "next/link"
import {
  ArrowUpRight,
  BookOpen,
  CreditCard,
  Landmark,
  TrendingUp,
  Users,
} from "lucide-react"
import type { AdminRevenueOverviewResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export default async function AdminDashboardPage() {
  const overview = await authenticatedApiFetch<AdminRevenueOverviewResponse>(
    "/admin/revenue",
    { cache: "no-store" },
  )

  const panels = [
    {
      body: "Review roles and suspend or reactivate accounts.",
      href: "/dashboard/admin/users",
      label: `${overview.totals.activeUsers} active`,
      title: "User management",
      icon: Users,
    },
    {
      body: "Approve submitted instructor courses before publishing.",
      href: "/dashboard/admin/courses",
      label: `${overview.totals.pendingCourses} pending`,
      title: "Course approval",
      icon: BookOpen,
    },
    {
      body: "Track paid revenue, pending revenue, and payment-method totals.",
      href: "/dashboard/admin/revenue",
      label: `৳ ${formatCurrency(overview.totals.paidRevenue)}`,
      title: "Revenue overview",
      icon: TrendingUp,
    },
    {
      body: "Review submitted transaction details and activate enrollments.",
      href: "/dashboard/admin/payments",
      label: `${overview.totals.pendingOrders} pending`,
      title: "Manual payments",
      icon: CreditCard,
    },
    {
      body: "Review instructor payout requests, approve them, and mark completed payouts as paid.",
      href: "/dashboard/admin/payouts",
      label: "Review queue",
      title: "Instructor payouts",
      icon: Landmark,
    },
  ]

  return (
    <main className="min-h-screen bg-[#0B0D0F] px-4 py-10 text-[#EDEEF0] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-6xl">
        {/* Masthead */}
        <div className="border-b border-[#22262B] pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#C9A24B]">
            Admin dashboard
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-[#EDEEF0] sm:text-4xl">
            Platform control center
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#8B929B]">
            Manage users, review submitted courses, monitor revenue, and
            process manual payments from one place.
          </p>
        </div>

        {/* Sections */}
        <div className="mt-8 grid gap-px overflow-hidden border border-[#22262B] bg-[#22262B] sm:grid-cols-2">
          {panels.map((panel, index) => {
            const Icon = panel.icon
            return (
              <Link
                className="group relative flex flex-col justify-between border-l-2 border-transparent bg-[#131619] p-6 transition-colors hover:border-[#C9A24B] hover:bg-[#0E1013]"
                href={panel.href}
                key={panel.href}
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#8B929B]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Icon className="h-4 w-4 text-[#C9A24B]" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#8B929B] transition-colors group-hover:text-[#C9A24B]" />
                  </div>
                  <h2 className="mt-4 text-xl text-[#EDEEF0] sm:text-2xl">
                    {panel.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#8B929B]">
                    {panel.body}
                  </p>
                </div>
                <p className="mt-6 font-mono text-sm text-[#C9A24B]">
                  {panel.label}
                </p>
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  )
}