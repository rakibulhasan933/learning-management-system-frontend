import Link from "next/link"
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

export default async function AdminPaymentsPage({
  searchParams,
}: AdminPaymentsPageProps) {
  const query = await searchParams
  const params = new URLSearchParams()

  if (query.q) {
    params.set("q", query.q)
  }

  if (query.paymentMethod) {
    params.set("paymentMethod", query.paymentMethod)
  }

  if (query.sort) {
    params.set("sort", query.sort)
  }

  const response = await authenticatedApiFetch<AdminPendingPaymentsResponse>(
    `/payments/admin/pending${params.size ? `?${params.toString()}` : ""}`,
    { cache: "no-store" },
  )

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Admin dashboard
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl tracking-tight">Pending payments</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review manual payment proofs, activate enrollments, and record the
              admin audit trail.
            </p>
          </div>
          <Link
            className="border border-border px-4 py-2 text-sm text-foreground"
            href="/dashboard/admin"
          >
            Back to dashboard
          </Link>
        </div>

        <form className="mt-8 grid gap-3 border border-border bg-card p-4 md:grid-cols-[1fr_180px_160px_auto]">
          <FloatingInput
            defaultValue={query.q ?? ""}
            label="Search reference or student email"
            name="q"
          />
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">Payment method</p>
            <Select defaultValue={query.paymentMethod ?? ""} name="paymentMethod">
              <SelectTrigger className="w-full rounded-2xl border-border bg-input/20">
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
            <p className="text-sm text-muted-foreground">Sort</p>
            <Select defaultValue={query.sort ?? "created_desc"} name="sort">
              <SelectTrigger className="w-full rounded-2xl border-border bg-input/20">
                <SelectValue placeholder="Newest first" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Newest first</SelectItem>
                <SelectItem value="created_asc">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Filter</Button>
        </form>

        <div className="mt-6 space-y-4">
          {response.orders.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="p-5 text-sm text-muted-foreground">
                No pending payments match the current filters.
              </CardContent>
            </Card>
          ) : (
            response.orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_260px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl">{order.courseTitle}</h2>
                      <span className="border border-primary px-2 py-1 font-mono text-xs text-primary">
                        {order.referenceCode}
                      </span>
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Student</dt>
                        <dd className="font-mono">{order.studentEmail}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Amount</dt>
                        <dd className="font-mono">
                          {order.currency} {order.amount}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Method</dt>
                        <dd>{order.paymentMethod ? methodLabels[order.paymentMethod] : "Not submitted"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Transaction ID</dt>
                        <dd className="font-mono">
                          {order.transactionId ?? "Not submitted"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Sender number</dt>
                        <dd className="font-mono">
                          {order.senderNumber ?? "Not submitted"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Submitted</dt>
                        <dd>{new Date(order.createdAt).toLocaleString()}</dd>
                      </div>
                    </dl>
                    {order.proofScreenshotUrl ? (
                      <a
                        className="mt-4 inline-block text-sm text-primary hover:underline"
                        href={order.proofScreenshotUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open screenshot
                      </a>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <form action={approvePaymentAction}>
                      <input name="orderId" type="hidden" value={order.id} />
                      <Button className="w-full" type="submit">
                        Approve
                      </Button>
                    </form>
                    <form action={rejectPaymentAction} className="space-y-2">
                      <input name="orderId" type="hidden" value={order.id} />
                      <FloatingTextarea
                        label="Rejection reason"
                        name="reason"
                        required
                      />
                      <Button className="w-full" variant="destructive" type="submit">
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
