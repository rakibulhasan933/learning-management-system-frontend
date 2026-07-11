import Link from "next/link"
import { redirect } from "next/navigation"
import type { PaymentInstructionsResponse } from "@workspace/types"

import { submitPaymentProofAction } from "@/app/courses/[slug]/enroll/actions"
import { ApiClientError, authenticatedApiFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

interface EnrollPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    error?: string
    orderId?: string
  }>
}

const paymentMethodLabels = {
  bank_transfer: "Bank transfer",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
} as const

export default async function EnrollPage({
  params,
  searchParams,
}: EnrollPageProps) {
  const { slug } = await params
  const query = await searchParams

  if (!query.orderId) {
    redirect(`/courses/${slug}`)
  }

  let payload: PaymentInstructionsResponse

  try {
    payload = await authenticatedApiFetch<PaymentInstructionsResponse>(
      `/payments/orders/${query.orderId}/instructions`,
      { cache: "no-store" },
    )
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      redirect(`/auth/login?next=${encodeURIComponent(`/courses/${slug}/enroll`)}`)
    }

    throw error
  }

  const { instructions, order } = payload
  const isPaid = order.status === "paid"

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Reference {order.referenceCode}
        </p>
        <h1 className="mt-3 text-4xl tracking-tight">{order.courseTitle}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Pay the exact amount using one of the listed methods, then submit the
          transaction details for admin verification.
        </p>

        {query.error ? (
          <p className="mt-6 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {query.error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="border border-border bg-card p-5">
            <h2 className="text-2xl">Payment instructions</h2>
            <dl className="mt-5 grid gap-4 text-sm">
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-mono">
                  {order.currency} {order.amount}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <dt className="text-muted-foreground">Reference</dt>
                <dd className="font-mono">{order.referenceCode}</dd>
              </div>
              {order.couponCode ? (
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Coupon</dt>
                  <dd className="font-mono">
                    {order.couponCode} (-{order.currency} {order.discountAmount})
                  </dd>
                </div>
              ) : null}
              {instructions.bkashNumber ? (
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">bKash</dt>
                  <dd className="font-mono">{instructions.bkashNumber}</dd>
                </div>
              ) : null}
              {instructions.nagadNumber ? (
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Nagad</dt>
                  <dd className="font-mono">{instructions.nagadNumber}</dd>
                </div>
              ) : null}
              {instructions.rocketNumber ? (
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Rocket</dt>
                  <dd className="font-mono">{instructions.rocketNumber}</dd>
                </div>
              ) : null}
              {instructions.bankDetails ? (
                <div className="grid gap-2 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Bank details</dt>
                  <dd className="whitespace-pre-line font-mono">
                    {instructions.bankDetails}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="border border-border bg-card p-5">
            <h2 className="text-2xl">
              {isPaid ? "Enrollment active" : "Submit proof"}
            </h2>
            {isPaid ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  This order is paid. Your course enrollment is active.
                </p>
                <Link
                  className="block bg-primary px-4 py-3 text-center text-sm text-primary-foreground"
                  href="/dashboard/student"
                >
                  Open dashboard
                </Link>
              </div>
            ) : (
              <form
                action={submitPaymentProofAction}
                className="mt-5 space-y-4"
              >
                <input name="orderId" type="hidden" value={order.id} />
                <input name="slug" type="hidden" value={slug} />
                <label className="block text-sm">
                  Payment method
                  <select
                    className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                    name="paymentMethod"
                    required
                  >
                    {Object.entries(paymentMethodLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Transaction ID
                  <input
                    className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                    name="transactionId"
                    required
                  />
                </label>
                <label className="block text-sm">
                  Sender number
                  <input
                    className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                    name="senderNumber"
                    required
                  />
                </label>
                <label className="block text-sm">
                  Screenshot
                  <input
                    accept="image/*"
                    className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none file:mr-3 file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground focus:border-primary"
                    name="proofScreenshot"
                    type="file"
                  />
                </label>
                <button
                  className="w-full bg-primary px-4 py-3 text-sm text-primary-foreground"
                  type="submit"
                >
                  Submit proof
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
