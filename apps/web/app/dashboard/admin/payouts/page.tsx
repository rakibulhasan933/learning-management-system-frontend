import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Landmark,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import type { AdminPayoutListResponse } from "@workspace/types"

import {
  approvePayoutAction,
  markPayoutPaidAction,
  rejectPayoutAction,
} from "../actions"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@workspace/ui/components/button"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { FloatingTextarea } from "@workspace/ui/components/floating-textarea"
import { PageHeader } from "@workspace/ui/components/page-header"
import { StatTile } from "@workspace/ui/components/stat-tile"
import { SubmitButton } from "@/components/submit-button"
import { PayoutStatusPill } from "@/components/status-pill"
import { formatCurrency, formatDateTime } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function AdminPayoutsPage() {
  const response = await authenticatedApiFetch<AdminPayoutListResponse>(
    "/admin/payouts",
    { cache: "no-store" }
  )

  const countOf = (status: string) =>
    response.payouts.filter((payout) => payout.status === status).length

  const stats = [
    { label: "Total", value: response.payouts.length, icon: <Landmark /> },
    {
      label: "Pending",
      value: countOf("pending"),
      icon: <Clock3 />,
      tone: "primary" as const,
    },
    { label: "Approved", value: countOf("approved"), icon: <ShieldCheck /> },
    {
      label: "Paid",
      value: countOf("paid"),
      icon: <CheckCircle2 />,
      tone: "secondary" as const,
    },
  ]

  return (
    <>
      <PageHeader
        action={
          <Button variant="outline">
            <Link href="/dashboard/admin">
              <ArrowLeft className="size-3.5" />
              Dashboard
            </Link>
          </Button>
        }
        eyebrow="Admin dashboard · Ledger"
        lede="Review payout requests, approve or reject what's pending, and mark approved requests paid once the transfer is sent."
        title="Instructor payouts"
      />

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <StatTile
            icon={stat.icon}
            key={stat.label}
            label={stat.label}
            tone={stat.tone}
            value={stat.value}
          />
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {response.payouts.length === 0 ? (
          <EmptyState
            description="Requests appear here as soon as an instructor submits one."
            icon={<Landmark />}
            title="No payout requests waiting"
          />
        ) : (
          response.payouts.map((payout, index) => (
            <article
              className="group relative rounded-2xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow duration-300 hover:ring-primary/40 sm:p-6"
              key={payout.id}
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <h2 className="font-heading text-xl tracking-tight sm:text-2xl">
                      {payout.instructorName ?? payout.instructorEmail}
                    </h2>
                    <PayoutStatusPill status={payout.status} />
                  </div>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    {payout.referenceCode}
                  </p>

                  <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <dt className="text-xs tracking-wide text-muted-foreground">
                        Amount
                      </dt>
                      <dd className="mt-0.5 font-mono text-primary tabular-nums">
                        {formatCurrency(payout.amount, payout.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs tracking-wide text-muted-foreground">
                        Submitted
                      </dt>
                      <dd className="mt-0.5 font-mono text-foreground">
                        {formatDateTime(payout.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs tracking-wide text-muted-foreground">
                        Reviewed by
                      </dt>
                      <dd className="mt-0.5 font-mono text-foreground">
                        {payout.reviewedByEmail ?? "Pending"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs tracking-wide text-muted-foreground">
                        Paid at
                      </dt>
                      <dd className="mt-0.5 font-mono text-foreground">
                        {payout.paidAt
                          ? formatDateTime(payout.paidAt)
                          : "Pending"}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {payout.note ?? "No note provided."}
                  </p>
                  {payout.rejectionReason ? (
                    <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      {payout.rejectionReason}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-3 lg:min-w-80">
                  {payout.status === "pending" ? (
                    <>
                      <form action={approvePayoutAction}>
                        <input
                          name="payoutId"
                          type="hidden"
                          value={payout.id}
                        />
                        <SubmitButton
                          className="w-full"
                          pendingLabel="Approving..."
                        >
                          <CheckCircle2 className="size-3.5" />
                          Approve
                        </SubmitButton>
                      </form>
                      <form className="grid gap-3" action={rejectPayoutAction}>
                        <input
                          name="payoutId"
                          type="hidden"
                          value={payout.id}
                        />
                        <FloatingTextarea
                          className="min-h-24"
                          label="Rejection reason"
                          name="rejectionReason"
                          required
                        />
                        <SubmitButton
                          className="w-full"
                          pendingLabel="Rejecting..."
                          variant="destructive"
                        >
                          <XCircle className="size-3.5" />
                          Reject
                        </SubmitButton>
                      </form>
                    </>
                  ) : null}

                  {payout.status === "approved" ? (
                    <form action={markPayoutPaidAction}>
                      <input name="payoutId" type="hidden" value={payout.id} />
                      <SubmitButton
                        className="w-full border-secondary/60 text-secondary hover:bg-secondary/10"
                        pendingLabel="Marking paid..."
                        variant="outline"
                      >
                        <Landmark className="size-3.5" />
                        Mark paid
                      </SubmitButton>
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  )
}
