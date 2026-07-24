import Link from "next/link"
import type { InstructorPayoutListResponse } from "@workspace/types"

import { requestInstructorPayoutAction } from "../actions"
import { authenticatedApiFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

function formatCurrency(value: number) {
  return `BDT ${value.toFixed(2)}`
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ")
}

export default async function InstructorPayoutsPage() {
  const payouts = await authenticatedApiFetch<InstructorPayoutListResponse>(
    "/instructor/payouts",
    { cache: "no-store" },
  )

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-sm text-muted-foreground">
              Instructor dashboard
            </p>
            <h1 className="mt-3 text-4xl tracking-tight">Payout requests</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              Request a payout against your available revenue balance and track
              the review status of each request.
            </p>
          </div>
          <Link
            className="border border-border px-4 py-2 text-sm text-foreground"
            href="/dashboard/instructor"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">
              Available balance
            </p>
            <p className="mt-3 text-2xl text-primary">
              {formatCurrency(payouts.availableBalance)}
            </p>
          </div>
          <div className="border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">
              Reserved amount
            </p>
            <p className="mt-3 text-2xl">
              {formatCurrency(payouts.reservedAmount)}
            </p>
          </div>
          <div className="border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">
              Total revenue
            </p>
            <p className="mt-3 text-2xl">
              {formatCurrency(payouts.totalRevenue)}
            </p>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            action={requestInstructorPayoutAction}
            className="border border-border bg-card p-5"
          >
            <p className="font-mono text-sm text-muted-foreground">
              New request
            </p>
            <h2 className="mt-2 text-2xl">Request payout</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Keep the amount within your current available balance. Requests
              are reviewed manually by the admin team.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  Amount
                </span>
                <input
                  className="border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  name="amount"
                  placeholder="0.00"
                  required
                  step="0.01"
                  type="number"
                  min="0.01"
                />
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  Note
                </span>
                <textarea
                  className="min-h-28 border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  name="note"
                  placeholder="Optional note for admin review"
                />
              </label>

              <input name="currency" type="hidden" value="BDT" />

              <button
                className="bg-primary px-4 py-2 text-sm text-primary-foreground"
                type="submit"
              >
                Submit request
              </button>
            </div>
          </form>

          <div className="border border-border bg-card p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-sm text-muted-foreground">
                  Request history
                </p>
                <h2 className="mt-2 text-2xl">All payout requests</h2>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {payouts.payouts.length} requests
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {payouts.payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payout requests have been submitted yet.
                </p>
              ) : (
                payouts.payouts.map((payout) => (
                  <article
                    className="border border-border bg-background p-4"
                    key={payout.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm">{payout.referenceCode}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {payout.note ?? "No note provided."}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">
                          {payout.currency} {payout.amount}
                        </p>
                        <span className="mt-2 inline-block border border-primary px-2 py-1 font-mono text-[11px] text-primary">
                          {statusLabel(payout.status)}
                        </span>
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Submitted</dt>
                        <dd className="font-mono">
                          {new Date(payout.createdAt).toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Reviewed by</dt>
                        <dd className="font-mono">
                          {payout.reviewedByEmail ?? "Pending review"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Reviewed at</dt>
                        <dd className="font-mono">
                          {payout.reviewedAt
                            ? new Date(payout.reviewedAt).toLocaleString()
                            : "Pending"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Paid at</dt>
                        <dd className="font-mono">
                          {payout.paidAt
                            ? new Date(payout.paidAt).toLocaleString()
                            : "Pending"}
                        </dd>
                      </div>
                    </dl>

                    {payout.rejectionReason ? (
                      <p className="mt-4 border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {payout.rejectionReason}
                      </p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}
