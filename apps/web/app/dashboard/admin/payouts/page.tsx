import Link from "next/link"
import type { AdminPayoutListResponse } from "@workspace/types"

import {
  approvePayoutAction,
  markPayoutPaidAction,
  rejectPayoutAction,
} from "../actions"
import { authenticatedApiFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

function statusLabel(status: string) {
  return status.replaceAll("_", " ")
}

function formatCurrency(currency: string, amount: string) {
  return `${currency} ${amount}`
}

export default async function AdminPayoutsPage() {
  const response = await authenticatedApiFetch<AdminPayoutListResponse>(
    "/admin/payouts",
    { cache: "no-store" },
  )

  const pendingCount = response.payouts.filter(
    (payout) => payout.status === "pending",
  ).length
  const approvedCount = response.payouts.filter(
    (payout) => payout.status === "approved",
  ).length
  const paidCount = response.payouts.filter(
    (payout) => payout.status === "paid",
  ).length

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-sm text-muted-foreground">
              Admin dashboard
            </p>
            <h1 className="mt-3 text-4xl tracking-tight">Instructor payouts</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review instructor payout requests, approve or reject pending
              requests, and mark approved payouts as paid.
            </p>
          </div>
          <Link
            className="border border-border px-4 py-2 text-sm text-foreground"
            href="/dashboard/admin"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">Total</p>
            <p className="mt-3 text-2xl">{response.payouts.length}</p>
          </div>
          <div className="border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">Pending</p>
            <p className="mt-3 text-2xl text-primary">{pendingCount}</p>
          </div>
          <div className="border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">Approved</p>
            <p className="mt-3 text-2xl">{approvedCount}</p>
          </div>
          <div className="border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">Paid</p>
            <p className="mt-3 text-2xl">{paidCount}</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {response.payouts.length === 0 ? (
            <div className="border border-border bg-card p-5 text-sm text-muted-foreground">
              No payout requests are waiting for review.
            </div>
          ) : (
            response.payouts.map((payout) => (
              <article className="border border-border bg-card p-5" key={payout.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl">{payout.instructorName ?? payout.instructorEmail}</h2>
                      <span className="border border-primary px-2 py-1 font-mono text-[11px] text-primary">
                        {statusLabel(payout.status)}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-sm text-muted-foreground">
                      {payout.referenceCode}
                    </p>

                    <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <dt className="text-muted-foreground">Amount</dt>
                        <dd className="font-mono">
                          {formatCurrency(payout.currency, payout.amount)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Submitted</dt>
                        <dd>{new Date(payout.createdAt).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Reviewed by</dt>
                        <dd className="font-mono">
                          {payout.reviewedByEmail ?? "Pending"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Paid at</dt>
                        <dd>
                          {payout.paidAt
                            ? new Date(payout.paidAt).toLocaleString()
                            : "Pending"}
                        </dd>
                      </div>
                    </dl>

                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {payout.note ?? "No note provided."}
                    </p>
                    {payout.rejectionReason ? (
                      <p className="mt-4 border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {payout.rejectionReason}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 lg:min-w-80">
                    {payout.status === "pending" ? (
                      <>
                        <form action={approvePayoutAction}>
                          <input name="payoutId" type="hidden" value={payout.id} />
                          <button
                            className="w-full bg-primary px-4 py-2 text-sm text-primary-foreground"
                            type="submit"
                          >
                            Approve
                          </button>
                        </form>
                        <form className="grid gap-3" action={rejectPayoutAction}>
                          <input name="payoutId" type="hidden" value={payout.id} />
                          <label className="grid gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              Rejection reason
                            </span>
                            <textarea
                              className="min-h-24 border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                              name="rejectionReason"
                              placeholder="Explain why the request was rejected"
                              required
                            />
                          </label>
                          <button
                            className="w-full border border-destructive/50 px-4 py-2 text-sm text-destructive"
                            type="submit"
                          >
                            Reject
                          </button>
                        </form>
                      </>
                    ) : null}

                    {payout.status === "approved" ? (
                      <form action={markPayoutPaidAction}>
                        <input name="payoutId" type="hidden" value={payout.id} />
                        <button
                          className="w-full border border-primary px-4 py-2 text-sm text-primary"
                          type="submit"
                        >
                          Mark paid
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
