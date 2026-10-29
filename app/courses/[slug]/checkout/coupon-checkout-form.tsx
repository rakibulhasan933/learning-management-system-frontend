"use client"

import { useEffect, useState, useTransition } from "react"

import {
  createEnrollmentOrderAction,
  previewCouponAction,
} from "@/app/courses/[slug]/enroll/actions"
import { REF_STORAGE_KEY } from "@/components/ref-capture"
import { SubmitButton } from "@/components/submit-button"
import { Button } from "@/components/ui/button"
import { FloatingInput } from "@/components/ui/floating-input"

type CouponCheckoutFormProps = {
  courseId: string
  currency: string
  originalAmount: string
  isFree: boolean
  slug: string
}

export function CouponCheckoutForm({
  courseId,
  currency,
  originalAmount,
  isFree,
  slug,
}: CouponCheckoutFormProps) {
  const [couponCode, setCouponCode] = useState("")
  const [pricing, setPricing] = useState({
    amount: originalAmount,
    discountAmount: "0.00",
    originalAmount,
  })
  const [message, setMessage] = useState("")
  const [isApplying, startApplying] = useTransition()
  // Referral code captured from ?ref= on the course/bundle page. It is
  // sent only as a hidden field so the order can be attributed
  // best-effort after creation; it never changes pricing or the flow.
  const [refCode, setRefCode] = useState("")

  useEffect(() => {
    try {
      setRefCode(window.localStorage.getItem(REF_STORAGE_KEY) ?? "")
    } catch {
      setRefCode("")
    }
  }, [])

  function applyCoupon() {
    if (!couponCode.trim()) {
      setMessage("Enter a coupon code first.")
      return
    }
    setMessage("")
    startApplying(async () => {
      try {
        const result = await previewCouponAction(courseId, couponCode.trim())
        setPricing(result)
        setMessage(`Coupon ${result.couponCode} applied successfully.`)
      } catch (error) {
        setPricing({
          amount: originalAmount,
          discountAmount: "0.00",
          originalAmount,
        })
        setMessage(
          error instanceof Error
            ? error.message
            : "Coupon could not be applied."
        )
      }
    })
  }

  return (
    <form
      action={createEnrollmentOrderAction}
      className="mt-8 grid gap-5 border-t border-border pt-6"
    >
      <input name="courseId" type="hidden" value={courseId} />
      <input name="slug" type="hidden" value={slug} />
      <input name="refCode" type="hidden" value={refCode} />
      <input
        name="couponCode"
        type="hidden"
        value={pricing.discountAmount !== "0.00" ? couponCode : ""}
      />
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <FloatingInput
            autoComplete="off"
            label="Coupon code (optional)"
            name="couponDisplay"
            onChange={(event) => {
              setCouponCode(event.target.value.toUpperCase())
              setPricing({
                amount: originalAmount,
                discountAmount: "0.00",
                originalAmount,
              })
              setMessage("")
            }}
            value={couponCode}
          />
        </div>
        <Button
          disabled={isApplying}
          onClick={applyCoupon}
          type="button"
          variant="outline"
        >
          {isApplying ? "Applying..." : "Apply coupon"}
        </Button>
      </div>
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
      <div className="grid gap-2 rounded-xl bg-background p-4 text-sm ring-1 ring-foreground/10">
        <div className="flex justify-between text-muted-foreground">
          <span>Original price</span>
          <span>
            {currency} {pricing.originalAmount}
          </span>
        </div>
        {pricing.discountAmount !== "0.00" ? (
          <div className="flex justify-between text-secondary">
            <span>Discount</span>
            <span>
              - {currency} {pricing.discountAmount}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-border pt-2 font-mono text-base text-foreground">
          <span>Payable amount</span>
          <span>
            {isFree || Number(pricing.amount) === 0
              ? "Free"
              : `${currency} ${pricing.amount}`}
          </span>
        </div>
      </div>
      <SubmitButton pendingLabel="Starting payment..." size="lg">
        {isFree || Number(pricing.amount) === 0
          ? "Enroll for free"
          : "Continue to payment"}
      </SubmitButton>
    </form>
  )
}
