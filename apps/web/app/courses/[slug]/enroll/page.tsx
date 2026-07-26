import Link from "next/link"
import { redirect } from "next/navigation"
import type { PaymentInstructionsResponse } from "@workspace/types"

import { submitPaymentProofAction } from "@/app/courses/[slug]/enroll/actions"
import { ApiClientError, authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"

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
  const paymentMethodOptions = Object.entries(paymentMethodLabels)

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Reference {order.referenceCode}
        </p>
        <h1 className="mt-3 text-3xl tracking-tight sm:text-4xl">{order.courseTitle}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Pay the exact amount using one of the listed methods, then submit the
          transaction details for admin verification.
        </p>

        {query.error ? (
          <p className="mt-6 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {query.error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="border-border bg-card">
            <CardContent className="grid gap-5 p-5 sm:p-6">
              <h2 className="font-display text-2xl tracking-tight">
                Payment instructions
              </h2>
              <dl className="mt-5 grid gap-4 text-sm">
                <div className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-mono sm:text-right">
                    {order.currency} {order.amount}
                  </dd>
                </div>
                <div className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                  <dt className="text-muted-foreground">Reference</dt>
                  <dd className="font-mono sm:text-right">{order.referenceCode}</dd>
                </div>
                {order.couponCode ? (
                  <div className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                    <dt className="text-muted-foreground">Coupon</dt>
                    <dd className="font-mono sm:text-right">
                      {order.couponCode} (-{order.currency} {order.discountAmount})
                    </dd>
                  </div>
                ) : null}
                {instructions.bkashNumber ? (
                  <div className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                    <dt className="text-muted-foreground">bKash</dt>
                    <dd className="font-mono sm:text-right">{instructions.bkashNumber}</dd>
                  </div>
                ) : null}
                {instructions.nagadNumber ? (
                  <div className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                    <dt className="text-muted-foreground">Nagad</dt>
                    <dd className="font-mono sm:text-right">{instructions.nagadNumber}</dd>
                  </div>
                ) : null}
                {instructions.rocketNumber ? (
                  <div className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                    <dt className="text-muted-foreground">Rocket</dt>
                    <dd className="font-mono sm:text-right">{instructions.rocketNumber}</dd>
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
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="grid gap-5 p-5 sm:p-6">
              <h2 className="font-display text-2xl tracking-tight">
                {isPaid ? "Enrollment active" : "Submit proof"}
              </h2>
              {isPaid ? (
                <div className="mt-4 space-y-4">
                  <p className="text-sm leading-6 text-muted-foreground">
                    This order is paid. Your course enrollment is active.
                  </p>
                  <Link
                    className="block rounded-2xl bg-primary px-4 py-3 text-center text-sm text-primary-foreground"
                    href="/dashboard/student"
                  >
                    Open dashboard
                  </Link>
                </div>
              ) : (
                <form
                  action={submitPaymentProofAction}
                  className="mt-5 grid gap-5"
                >
                  <input name="orderId" type="hidden" value={order.id} />
                  <input name="slug" type="hidden" value={slug} />
                  <div className="grid gap-2">
                    <p className="text-sm text-muted-foreground">Payment method</p>
                    <Select defaultValue="bkash" name="paymentMethod">
                      <SelectTrigger className="w-full rounded-2xl border-border bg-input/20">
                        <SelectValue placeholder="Payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethodOptions.map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FloatingInput label="Transaction ID" name="transactionId" />
                  <FloatingInput label="Sender number" name="senderNumber" />
                  <label className="grid gap-2 text-sm text-muted-foreground">
                    <span>Screenshot</span>
                    <input
                      accept="image/*"
                      className="w-full rounded-2xl border border-border bg-input/20 px-3 py-2 text-sm text-foreground file:mr-3 file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
                      name="proofScreenshot"
                      type="file"
                    />
                  </label>
                  <Button className="w-full" type="submit">
                    Submit proof
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
