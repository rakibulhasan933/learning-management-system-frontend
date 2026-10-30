import Link from "next/link"
import { redirect } from "next/navigation"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { PaymentInstructionsResponse } from "@/lib/types"

import { submitPaymentProofAction } from "@/app/courses/[slug]/enroll/actions"
import { ApiClientError, authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { ProgressThread } from "@/components/ui/progress-thread"
import { SubmitButton } from "@/components/submit-button"

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
      { cache: "no-store" }
    )
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      redirect(
        `/auth/login?next=${encodeURIComponent(`/courses/${slug}/enroll`)}`
      )
    }

    throw error
  }

  const { instructions, order } = payload
  const isPaid = order.status === "paid"
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10">
      <section className="mx-auto max-w-5xl">
        <ProgressThread className="mb-8" />
        <p className="font-mono text-xs tracking-wide text-muted-foreground">
          Reference {order.referenceCode}
        </p>
        <h1 className="mt-3 font-heading text-4xl leading-[1.1] tracking-tight sm:text-5xl">
          {order.courseTitle}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          Pay the exact amount using one of the listed methods, then submit the
          transaction ID and sender number for automatic verification.
        </p>

        {query.error ? (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{query.error}</p>
          </div>
        ) : null}

        <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <Card>
            <CardContent>
              <p className="font-mono text-xs tracking-wide text-muted-foreground">
                Automatic verification
              </p>
              <h2 className="mt-2 font-heading text-2xl tracking-tight">
                Payment instructions
              </h2>
              <dl className="mt-5 grid gap-4 border-t border-border pt-5 text-sm [&>div:last-child]:border-b-0 [&>div:last-child]:pb-0">
                <div className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-mono sm:text-right">
                    {order.currency} {order.amount}
                  </dd>
                </div>
                <div className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                  <dt className="text-muted-foreground">Reference</dt>
                  <dd className="font-mono sm:text-right">
                    {order.referenceCode}
                  </dd>
                </div>
                {order.couponCode ? (
                  <div className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                    <dt className="text-muted-foreground">Coupon</dt>
                    <dd className="font-mono sm:text-right">
                      {order.couponCode} (-{order.currency}{" "}
                      {order.discountAmount})
                    </dd>
                  </div>
                ) : null}
                {instructions.bkashNumber ? (
                  <div className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                    <dt className="text-muted-foreground">bKash</dt>
                    <dd className="font-mono sm:text-right">
                      {instructions.bkashNumber}
                    </dd>
                  </div>
                ) : null}
                {instructions.nagadNumber ? (
                  <div className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                    <dt className="text-muted-foreground">Nagad</dt>
                    <dd className="font-mono sm:text-right">
                      {instructions.nagadNumber}
                    </dd>
                  </div>
                ) : null}
                {instructions.rocketNumber ? (
                  <div className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                    <dt className="text-muted-foreground">Rocket</dt>
                    <dd className="font-mono sm:text-right">
                      {instructions.rocketNumber}
                    </dd>
                  </div>
                ) : null}
                {instructions.bankDetails ? (
                  <div className="grid gap-2 border-b border-border pb-3">
                    <dt className="text-muted-foreground">Bank details</dt>
                    <dd className="font-mono whitespace-pre-line">
                      {instructions.bankDetails}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="font-mono text-xs tracking-wide text-muted-foreground">
                {isPaid ? "Verified" : "Step 2"}
              </p>
              <h2 className="mt-2 font-heading text-2xl tracking-tight">
                {isPaid ? "Enrollment active" : "Verify payment"}
              </h2>
              {isPaid ? (
                <div className="mt-5 space-y-5 border-t border-border pt-5">
                  <div className="flex items-start gap-2 rounded-xl border border-secondary/30 bg-secondary/5 p-3 text-sm text-secondary">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                    <p>This order is paid. Your course enrollment is active.</p>
                  </div>
                  <Button className="w-full">
                    <Link href="/dashboard/student">Open dashboard</Link>
                  </Button>
                </div>
              ) : (
                <form
                  action={submitPaymentProofAction}
                  className="mt-5 grid gap-5 border-t border-border pt-5"
                >
                  <input name="orderId" type="hidden" value={order.id} />
                  <input name="slug" type="hidden" value={slug} />
                  <FloatingInput label="Transaction ID" name="transactionId" />
                  <p className="-mt-2 text-xs leading-5 text-muted-foreground">
                    The exact order amount will be sent for verification:{" "}
                    {order.currency} {order.amount}.
                  </p>
                  <FloatingInput label="Sender number" name="senderNumber" />
                  <SubmitButton
                    className="w-full"
                    pendingLabel="Verifying payment..."
                  >
                    Verify payment
                  </SubmitButton>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
