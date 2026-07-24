import Link from "next/link"
import type { AdminRevenueOverviewResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

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
    },
    {
      body: "Approve submitted instructor courses before publishing.",
      href: "/dashboard/admin/courses",
      label: `${overview.totals.pendingCourses} pending`,
      title: "Course approval",
    },
    {
      body: "Track paid revenue, pending revenue, and payment-method totals.",
      href: "/dashboard/admin/revenue",
      label: `BDT ${overview.totals.paidRevenue.toFixed(2)}`,
      title: "Revenue overview",
    },
    {
      body: "Review submitted transaction details and activate enrollments.",
      href: "/dashboard/admin/payments",
      label: `${overview.totals.pendingOrders} pending`,
      title: "Manual payments",
    },
    {
      body: "Review instructor payout requests, approve them, and mark completed payouts as paid.",
      href: "/dashboard/admin/payouts",
      label: "review queue",
      title: "Instructor payouts",
    },
  ]

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">Admin dashboard</p>
        <h1 className="mt-3 text-4xl tracking-tight">Platform control center</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Manage users, review submitted courses, monitor revenue, and process
          manual payments from the backend-owned control surface.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {panels.map((panel) => (
            <Link
              className="block border border-border bg-card p-5 hover:border-primary"
              href={panel.href}
              key={panel.href}
            >
              <p className="font-mono text-sm text-primary">{panel.label}</p>
              <h2 className="mt-2 text-2xl">{panel.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {panel.body}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
