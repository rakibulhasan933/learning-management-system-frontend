import Link from "next/link"
import {
  ArrowLeft,
  Clock3,
  Hash,
  ImageIcon,
  Search,
  Smartphone,
} from "lucide-react"
import type { AdminPendingPaymentsResponse, PaymentMethod } from "@workspace/types"

import {
  approvePaymentAction,
  rejectPaymentAction,
} from "@/app/dashboard/admin/payments/actions"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import { FloatingTextarea } from "@workspace/ui/components/floating-textarea"

export const dynamic = "force-dynamic"

interface AdminPaymentsPageProps {
  searchParams: Promise<{
    paymentMethod?: PaymentMethod
    q?: string
    sort?: "created_asc" | "created_desc"
  }>
}

const methodLabels: Record<string, string> = {
  bank_transfer: "Bank transfer",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
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

function formatAmount(currency: string, amount: string) {
  const numeric = Number(amount)
  const formatted = Number.isFinite(numeric)
    ? new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numeric)
    : amount
  return `${currency} ${formatted}`
}

export default async function AdminPaymentsPage({
  searchParams,
}: AdminPaymentsPageProps) {
  const query = await searchParams
  const params = new URLSearchParams()

  if (query.q) params.set("q", query.q)
  if (query.paymentMethod) params.set("paymentMethod", query.paymentMethod)
  if (query.sort) params.set("sort", query.sort)

  const response = await authenticatedApiFetch<AdminPendingPaymentsResponse>(
    `/payments/admin/pending${params.size ? `?${params.toString()}` : ""}`,
    { cache: "no-store" },
  )

  const hasFilters = Boolean(query.q || query.paymentMethod)
  const total = response.orders.length

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
              Pending payments
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#8B929B]">
              Review manual payment proofs, activate enrollments, and keep the
              audit trail on record.
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

        {/* Queue stat */}
        <div className="mt-6 flex items-center gap-3 border border-[#22262B] bg-[#0E1013] px-5 py-4">
          <Clock3 className="h-4 w-4 text-[#C9A24B]" />
          <p className="text-sm text-[#8B929B]">
            <span className="font-mono text-lg text-[#EDEEF0]">
              {String(total).padStart(2, "0")}
            </span>{" "}
            {total === 1 ? "payment" : "payments"} waiting on review
          </p>
        </div>

        {/* Filters */}
        <form className="mt-6 grid gap-3 border border-[#22262B] bg-[#131619] p-4 md:grid-cols-[1fr_180px_160px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-[38px] h-3.5 w-3.5 -translate-y-1/2 text-[#8B929B]" />
            <FloatingInput
              className="border-[#22262B] bg-[#0E1013] pl-9 text-[#EDEEF0] focus-visible:border-[#C9A24B]/60"
              defaultValue={query.q ?? ""}
              label="Search reference or student email"
              name="q"
            />
          </div>
          <div className="grid gap-2">
            <p className="text-xs uppercase tracking-wide text-[#8B929B]">
              Payment method
            </p>
            <Select defaultValue={query.paymentMethod ?? ""} name="paymentMethod">
              <SelectTrigger className="w-full border-[#22262B] bg-[#0E1013] text-[#EDEEF0]">
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All methods</SelectItem>
                {Object.entries(methodLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <p className="text-xs uppercase tracking-wide text-[#8B929B]">
              Sort
            </p>
            <Select defaultValue={query.sort ?? "created_desc"} name="sort">
              <SelectTrigger className="w-full border-[#22262B] bg-[#0E1013] text-[#EDEEF0]">
                <SelectValue placeholder="Newest first" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Newest first</SelectItem>
                <SelectItem value="created_asc">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="self-end bg-[#C9A24B] text-[#14110A] hover:opacity-90"
            type="submit"
          >
            Filter
          </Button>
        </form>
        {hasFilters && (
          <Link
            className="mt-2 inline-block text-xs text-[#8B929B] underline decoration-[#22262B] underline-offset-4 hover:text-[#C9A24B]"
            href="/dashboard/admin/payments"
          >
            Clear filters
          </Link>
        )}

        {/* Queue */}
        <div className="mt-6 space-y-3">
          {response.orders.length === 0 ? (
            <Card className="border-[#22262B] bg-[#131619]">
              <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                <ImageIcon className="h-5 w-5 text-[#8B929B]" />
                <p className="text-sm text-[#EDEEF0]">
                  No pending payments match the current filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            response.orders.map((order, index) => (
              <Card
                className="group relative overflow-hidden border-[#22262B] bg-[#131619]"
                key={order.id}
              >
                <div className="absolute inset-y-0 left-0 w-[2px] bg-transparent transition-colors group-hover:bg-[#C9A24B]" />
                <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_260px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs text-[#8B929B]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h2 className="text-xl text-[#EDEEF0] sm:text-2xl">
                        {order.courseTitle}
                      </h2>
                      <span className="inline-flex items-center gap-1.5 border border-[#C9A24B]/60 px-2 py-1 font-mono text-[11px] text-[#C9A24B]">
                        <Hash className="h-3 w-3" />
                        {order.referenceCode}
                      </span>
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                          Student
                        </dt>
                        <dd className="mt-0.5 font-mono text-[#EDEEF0]">
                          {order.studentEmail}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                          Amount
                        </dt>
                        <dd className="mt-0.5 font-mono text-[#C9A24B]">
                          {formatAmount(order.currency, order.amount)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                          Method
                        </dt>
                        <dd className="mt-0.5 flex items-center gap-1.5 text-[#EDEEF0]">
                          <Smartphone className="h-3.5 w-3.5 text-[#8B929B]" />
                          {order.paymentMethod
                            ? methodLabels[order.paymentMethod]
                            : "Not submitted"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                          Transaction ID
                        </dt>
                        <dd className="mt-0.5 font-mono text-[#EDEEF0]">
                          {order.transactionId ?? "Not submitted"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                          Sender number
                        </dt>
                        <dd className="mt-0.5 font-mono text-[#EDEEF0]">
                          {order.senderNumber ?? "Not submitted"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                          Submitted
                        </dt>
                        <dd className="mt-0.5 font-mono text-[#EDEEF0]">
                          {formatDateTime(order.createdAt)}
                        </dd>
                      </div>
                    </dl>
                    {order.proofScreenshotUrl ? (
                      <a
                        className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#C9A24B] hover:underline"
                        href={order.proofScreenshotUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        Open screenshot
                      </a>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <form action={approvePaymentAction}>
                      <input name="orderId" type="hidden" value={order.id} />
                      <Button
                        className="w-full bg-[#C9A24B] text-[#14110A] hover:opacity-90"
                        type="submit"
                      >
                        Approve
                      </Button>
                    </form>
                    <form action={rejectPaymentAction} className="space-y-2">
                      <input name="orderId" type="hidden" value={order.id} />
                      <FloatingTextarea
                        className="border-[#22262B] bg-[#0E1013] text-[#EDEEF0] focus-visible:border-[#C9A24B]/60"
                        label="Rejection reason"
                        name="reason"
                        required
                      />
                      <Button
                        className="w-full border-[#E5484D]/50 text-[#E5484D] hover:bg-[#E5484D]/10"
                        type="submit"
                        variant="destructive"
                      >
                        Reject
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </main>
  )
}