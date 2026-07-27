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

export const dynamic = "force-dynamic"

function statusLabel(status: string) {
  return status.replaceAll("_", " ")
}

function formatCurrency(currency: string, amount: string) {
  const numeric = Number(amount)
  const formatted = Number.isFinite(numeric)
    ? new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numeric)
    : amount
  return `${currency} ${formatted}`
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const STATUS_STYLE: Record<
  string,
  { dot: string; text: string; icon: typeof Clock3 }
> = {
  pending: { dot: "bg-[#D9A441]", text: "text-[#D9A441]", icon: Clock3 },
  approved: { dot: "bg-[#6C9BFF]", text: "text-[#6C9BFF]", icon: ShieldCheck },
  paid: { dot: "bg-[#4FAE7C]", text: "text-[#4FAE7C]", icon: CheckCircle2 },
  rejected: { dot: "bg-[#E5484D]", text: "text-[#E5484D]", icon: XCircle },
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE["pending"]
  // style is guaranteed via fallback above; assert non-null for TypeScript
  return (
    <span
      className={`inline-flex items-center gap-1.5 border border-[#22262B] px-2 py-1 font-mono text-[11px] uppercase tracking-wide ${style!.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style!.dot}`} />
      {statusLabel(status)}
    </span>
  )
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

  const stats = [
    { label: "Total", value: response.payouts.length, tone: "default" as const },
    { label: "Pending", value: pendingCount, tone: "warn" as const },
    { label: "Approved", value: approvedCount, tone: "blue" as const },
    { label: "Paid", value: paidCount, tone: "green" as const },
  ]

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
              Instructor payouts
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#8B929B]">
                  Review payout requests, approve or reject what&apos;s pending, and
              mark approved requests paid once the transfer is sent.
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

        {/* Stat strip */}
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden border border-[#22262B] bg-[#22262B] sm:grid-cols-4">
          {stats.map(({ label, value, tone }) => (
            <div className="bg-[#0E1013] px-5 py-4" key={label}>
              <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                {label}
              </dt>
              <dd
                className={`mt-1.5 font-mono text-2xl ${
                  tone === "warn"
                    ? "text-[#D9A441]"
                    : tone === "blue"
                      ? "text-[#6C9BFF]"
                      : tone === "green"
                        ? "text-[#4FAE7C]"
                        : "text-[#EDEEF0]"
                }`}
              >
                {String(value).padStart(2, "0")}
              </dd>
            </div>
          ))}
        </dl>

        {/* Queue */}
        <div className="mt-6 divide-y divide-[#22262B] border border-[#22262B] bg-[#131619]">
          {response.payouts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
              <Landmark className="h-5 w-5 text-[#8B929B]" />
              <p className="text-sm text-[#EDEEF0]">
                No payout requests are waiting for review.
              </p>
            </div>
          ) : (
            response.payouts.map((payout, index) => (
              <article
                className="group relative border-l-2 border-transparent px-5 py-6 transition-colors hover:border-[#C9A24B] hover:bg-[#0E1013] sm:px-6"
                key={payout.id}
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs text-[#8B929B]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h2 className="text-xl text-[#EDEEF0] sm:text-2xl">
                        {payout.instructorName ?? payout.instructorEmail}
                      </h2>
                      <StatusBadge status={payout.status} />
                    </div>
                    <p className="mt-2 font-mono text-xs text-[#8B929B]">
                      {payout.referenceCode}
                    </p>

                    <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                          Amount
                        </dt>
                        <dd className="mt-0.5 font-mono text-[#C9A24B]">
                          {formatCurrency(payout.currency, payout.amount)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                          Submitted
                        </dt>
                        <dd className="mt-0.5 font-mono text-[#EDEEF0]">
                          {formatDateTime(payout.createdAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                          Reviewed by
                        </dt>
                        <dd className="mt-0.5 font-mono text-[#EDEEF0]">
                          {payout.reviewedByEmail ?? "Pending"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                          Paid at
                        </dt>
                        <dd className="mt-0.5 font-mono text-[#EDEEF0]">
                          {payout.paidAt
                            ? formatDateTime(payout.paidAt)
                            : "Pending"}
                        </dd>
                      </div>
                    </dl>

                    <p className="mt-4 text-sm leading-6 text-[#8B929B]">
                      {payout.note ?? "No note provided."}
                    </p>
                    {payout.rejectionReason ? (
                      <p className="mt-4 border border-[#E5484D]/40 bg-[#E5484D]/10 px-3 py-2 text-sm text-[#E5484D]">
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
                          <button
                            className="flex w-full items-center justify-center gap-2 bg-[#C9A24B] px-4 py-2 text-sm font-medium text-[#14110A] transition-opacity hover:opacity-90"
                            type="submit"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </button>
                        </form>
                        <form className="grid gap-3" action={rejectPayoutAction}>
                          <input
                            name="payoutId"
                            type="hidden"
                            value={payout.id}
                          />
                          <label className="grid gap-2">
                            <span className="text-xs uppercase tracking-wide text-[#8B929B]">
                              Rejection reason
                            </span>
                            <textarea
                              className="min-h-24 border border-[#22262B] bg-[#0E1013] px-3 py-2 text-sm text-[#EDEEF0] outline-none placeholder:text-[#8B929B] focus:border-[#C9A24B]/60"
                              name="rejectionReason"
                              placeholder="Explain why the request was rejected"
                              required
                            />
                          </label>
                          <button
                            className="flex w-full items-center justify-center gap-2 border border-[#E5484D]/50 px-4 py-2 text-sm text-[#E5484D] transition-colors hover:bg-[#E5484D]/10"
                            type="submit"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </form>
                      </>
                    ) : null}

                    {payout.status === "approved" ? (
                      <form action={markPayoutPaidAction}>
                        <input name="payoutId" type="hidden" value={payout.id} />
                        <button
                          className="flex w-full items-center justify-center gap-2 border border-[#4FAE7C]/60 px-4 py-2 text-sm text-[#4FAE7C] transition-colors hover:bg-[#4FAE7C]/10"
                          type="submit"
                        >
                          <Landmark className="h-3.5 w-3.5" />
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