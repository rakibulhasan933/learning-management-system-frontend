import type { InstructorPayoutListResponse } from "@/lib/types"

import { ApiClientError, authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { StatTile } from "@/components/ui/stat-tile"
import { SubmitButton } from "@/components/submit-button"
import { formatCurrency, formatDate } from "@/lib/format"
import { requestInstructorPayoutAction } from "@/app/dashboard/instructor/actions"

export const dynamic = "force-dynamic"

export default async function InstructorPayoutsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>
}) {
  const params = (await searchParams) ?? {}
  const submitError = params.error

  // If the backend still rejects instructor payouts (e.g. 403 while the
  // endpoint is being enabled), show a plain error instead of crashing.
  let response: InstructorPayoutListResponse | null = null
  let loadError: string | null = null
  try {
    response = await authenticatedApiFetch<InstructorPayoutListResponse>(
      "/instructor/payouts",
      { cache: "no-store" }
    )
  } catch (error) {
    loadError =
      error instanceof ApiClientError
        ? error.message
        : "Payout history could not be loaded."
  }

  const payouts = response?.payouts ?? []

  return (
    <>
      <PageHeader
        eyebrow="Instructor dashboard · Payouts"
        lede="Request a payout and track your previous requests. Payouts are reviewed by an admin."
        title="Payouts"
      />

      {submitError ? (
        <p className="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Payout request failed: {submitError}
        </p>
      ) : null}

      {loadError ? (
        <p className="mt-8 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          Payout history could not be loaded: {loadError} You can still submit a
          request below.
        </p>
      ) : null}

      {response ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatTile
            hint="Available to request"
            label="Available balance"
            value={formatCurrency(response.availableBalance)}
          />
          <StatTile
            hint="Held in pending requests"
            label="Reserved amount"
            value={formatCurrency(response.reservedAmount)}
          />
          <StatTile
            hint="Across your courses"
            label="Total revenue"
            value={formatCurrency(response.totalRevenue)}
          />
        </div>
      ) : null}

      <Card className="mt-6">
        <CardContent className="space-y-3">
          <h2 className="font-heading text-xl">Request a payout</h2>
          <form action={requestInstructorPayoutAction} className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Amount (BDT)</span>
              <input
                className="h-10 rounded-xl border border-input bg-input/30 px-3"
                min="1"
                name="amount"
                required
                type="number"
              />
            </label>
            <input name="currency" type="hidden" value="BDT" />
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Note (optional)</span>
              <textarea
                className="min-h-20 rounded-xl border border-input bg-input/30 px-3 py-2"
                name="note"
              />
            </label>
            <SubmitButton pendingLabel="Submitting...">
              Request payout
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="space-y-3">
          <h2 className="font-heading text-xl">Your payout requests</h2>
          {payouts.length === 0 && !loadError ? (
            <EmptyState
              description="Requests appear here as soon as you submit one."
              title="No payout requests yet"
            />
          ) : (
            payouts.map((payout) => (
              <div
                className="grid gap-2 rounded-xl border border-border p-4"
                key={payout.id}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-sm">{payout.referenceCode}</p>
                  <p className="font-mono text-sm">
                    {formatCurrency(payout.amount, payout.currency)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {payout.status} · {formatDate(payout.createdAt)}
                </p>
                {payout.note ? <p className="text-sm">{payout.note}</p> : null}
                {payout.rejectionReason ? (
                  <p className="text-sm text-destructive">
                    Rejected: {payout.rejectionReason}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  )
}
