"use client"

import { useState } from "react"
import { Check, Copy, Phone } from "lucide-react"

import { submitPaymentProofAction } from "@/app/courses/[slug]/enroll/actions"
import { SubmitButton } from "@/components/submit-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const gatewayDetails = {
  bkash: { accent: "#e2136e", name: "bKash" },
  nagad: { accent: "#e91429", name: "Nagad" },
  rocket: { accent: "#8c3494", name: "Rocket" },
} as const

type Gateway = keyof typeof gatewayDetails

type GatewayCheckoutProps = {
  amount: string
  customerEmail: string
  error?: string
  gateway: Gateway
  orderId: string
  packageName?: string
  receiverNumber: string
  slug: string
}

export default function GatewayCheckout({
  amount,
  customerEmail,
  error: initialError,
  gateway,
  orderId,
  packageName,
  receiverNumber,
  slug,
}: GatewayCheckoutProps) {
  const details = gatewayDetails[gateway]
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState("")
  const [transactionId, setTransactionId] = useState("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(initialError ?? "")
  const validPhone = /^01\d{9}$/.test(phone)
  const validTransaction = transactionId.trim().length >= 6

  async function copyReceiverNumber() {
    try {
      await navigator.clipboard.writeText(receiverNumber)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setError("Could not copy the payment number.")
    }
  }

  function proceed() {
    if (!validPhone) {
      setError("Enter a valid 11-digit sender number.")
      return
    }

    setError("")
    setStep(2)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-3 py-6 sm:px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-5 text-center">
          <span
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: details.accent }}
          >
            Pay-Confirm
          </span>
          <p className="mt-1 text-xs text-slate-400">
            Secure {details.name} checkout
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {packageName || "Course enrollment"}
            </p>
            <p className="truncate text-xs text-slate-400">Order: {orderId}</p>
            <p className="truncate text-xs text-slate-400">{customerEmail}</p>
          </div>
          <p className="text-2xl font-bold whitespace-nowrap text-slate-900">
            ৳{Number(amount || 0).toFixed(2)}
          </p>
        </div>

        <form
          action={submitPaymentProofAction}
          onSubmit={() => {
            console.info("[payment][browser] Verify payment clicked", {
              gateway,
              orderId,
              senderNumber:
                phone.length > 4
                  ? `${phone.slice(0, 2)}****${phone.slice(-2)}`
                  : "****",
              transactionId:
                transactionId.length > 4
                  ? `${transactionId.slice(0, 2)}****${transactionId.slice(-2)}`
                  : "****",
            })
          }}
        >
          <input name="gateway" type="hidden" value={gateway} />
          <input name="orderId" type="hidden" value={orderId} />
          <input name="slug" type="hidden" value={slug} />
          <input name="senderNumber" type="hidden" value={phone} />

          <div
            className="px-5 py-6 text-center text-white sm:px-6"
            style={{ backgroundColor: details.accent }}
          >
            {step === 1 ? (
              <>
                <p className="text-lg font-semibold">
                  Your {details.name} account number
                </p>
                <Input
                  autoFocus
                  className="mt-4 h-12 rounded-xl border-0 bg-white text-center text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-white"
                  inputMode="tel"
                  maxLength={11}
                  onChange={(event) =>
                    setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  placeholder="e.g. 01XXXXXXXXX"
                  value={phone}
                />
                <p className="mt-4 text-xs leading-5 text-white/80">
                  Enter the number you used to send the payment.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold">Send money and verify</p>
                <p className="mt-2 text-sm text-white/85">
                  Send exactly ৳{Number(amount || 0).toFixed(2)} to this number.
                </p>
                <div className="mx-auto mt-4 flex max-w-sm items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-slate-900">
                  <div className="min-w-0 text-left">
                    <p className="text-xs text-slate-500">Receiver number</p>
                    <p className="mt-1 truncate text-xl font-bold tracking-wide">
                      {receiverNumber}
                    </p>
                  </div>
                  <Button
                    aria-label="Copy receiver number"
                    className="size-10 shrink-0 text-slate-700"
                    onClick={copyReceiverNumber}
                    type="button"
                    variant="ghost"
                  >
                    {copied ? (
                      <Check className="size-5" />
                    ) : (
                      <Copy className="size-5" />
                    )}
                  </Button>
                </div>
                <label className="mt-5 block text-left text-xs font-semibold">
                  Transaction ID
                </label>
                <Input
                  autoFocus
                  className="mt-2 h-12 rounded-xl border-0 bg-white text-slate-900 uppercase placeholder:text-slate-400 placeholder:normal-case focus-visible:ring-2 focus-visible:ring-white"
                  name="transactionId"
                  onChange={(event) =>
                    setTransactionId(event.target.value.toUpperCase())
                  }
                  placeholder="Enter transaction ID"
                  value={transactionId}
                />
              </>
            )}
            {error ? (
              <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm font-medium text-red-600">
                {error}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 p-4">
            <Button
              onClick={() => (step === 1 ? history.back() : setStep(1))}
              type="button"
              variant="outline"
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            {step === 1 ? (
              <Button
                disabled={!validPhone}
                onClick={proceed}
                style={{ backgroundColor: details.accent }}
                type="button"
              >
                Proceed
              </Button>
            ) : (
              <SubmitButton
                disabled={!validTransaction}
                pendingLabel="Verifying payment…"
                style={{ backgroundColor: details.accent }}
              >
                Verify payment
              </SubmitButton>
            )}
          </div>
        </form>

        <div className="border-t border-slate-100 px-4 py-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500">
            <Phone className="size-3.5" /> Secure payment verification
          </p>
        </div>
      </div>
    </main>
  )
}
