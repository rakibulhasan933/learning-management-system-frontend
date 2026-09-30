import Link from "next/link"
import {
  ArrowUpRight,
  BookOpen,
  CreditCard,
  Landmark,
  TrendingUp,
  Users,
} from "lucide-react"
import type { AdminRevenueOverviewResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/ui/page-header"
import { StatTile } from "@/components/ui/stat-tile"
import { formatCurrency } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const overview = await authenticatedApiFetch<AdminRevenueOverviewResponse>(
    "/admin/revenue",
    { cache: "no-store" }
  )

  const { totals } = overview

  const panels = [
    {
      body: "Review roles and suspend or reactivate accounts.",
      href: "/dashboard/admin/users",
      label: `${totals.activeUsers} active`,
      title: "User management",
      icon: Users,
    },
    {
      body: "Approve submitted instructor courses before publishing.",
      href: "/dashboard/admin/courses",
      label: `${totals.pendingCourses} pending`,
      title: "Course approval",
      icon: BookOpen,
    },
    {
      body: "Track paid revenue, pending revenue, and payment-method totals.",
      href: "/dashboard/admin/revenue",
      label: formatCurrency(totals.paidRevenue),
      title: "Revenue overview",
      icon: TrendingUp,
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
    <>
      <PageHeader
        eyebrow="Admin dashboard"
        lede="Manage users, review submitted courses, monitor revenue, and process manual payments from one place."
        title="Platform control center"
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          hint={`${totals.paidOrders} paid orders`}
          icon={<TrendingUp />}
          label="Paid revenue"
          tone="primary"
          value={formatCurrency(totals.paidRevenue)}
        />
        <StatTile
          hint={`${totals.pendingOrders} awaiting review`}
          icon={<CreditCard />}
          label="Pending revenue"
          value={formatCurrency(totals.pendingRevenue)}
        />
        <StatTile
          hint={`${totals.publishedCourses} published courses`}
          icon={<BookOpen />}
          label="Active enrollments"
          value={totals.activeEnrollments}
        />
        <StatTile
          hint={
            totals.suspendedUsers > 0
              ? `${totals.suspendedUsers} suspended`
              : "None suspended"
          }
          icon={<Users />}
          label="Active users"
          value={totals.activeUsers}
        />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {panels.map((panel, index) => {
          const Icon = panel.icon
          return (
            <Link
              className="group interactive-card relative flex flex-col justify-between rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
              href={panel.href}
              key={panel.href}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {index + 1}
                    </span>
                    <Icon className="size-4 text-primary" />
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <h2 className="mt-4 font-heading text-xl tracking-tight sm:text-2xl">
                  {panel.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {panel.body}
                </p>
              </div>
              <p className="mt-6 font-mono text-sm text-primary">
                {panel.label}
              </p>
            </Link>
          )
        })}
      </div>
    </>
  )
}
