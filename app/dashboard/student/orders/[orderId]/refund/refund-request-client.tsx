"use client"

import { useState } from "react"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { requestRefundAction } from "./actions"

/** Refund request form. 400 → rule text, 409 → duplicate message, both from the backend. */
export function RefundRequestForm({ orderId }: { orderId: string }) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        setError(null)
        setSaved(false)
        if (!reason.trim()) {
          setError("রিফান্ডের কারণ লিখুন। কারণ ছাড়া রিকোয়েস্ট জমা হবে না।")
          return
        }
        setPending(true)
        try {
          const formData = new FormData()
          formData.set("reason", reason.trim())
          await requestRefundAction(orderId, formData)
          setSaved(true)
          setReason("")
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "রিফান্ড রিকোয়েস্ট জমা দেওয়া যায়নি।"
          )
        } finally {
          setPending(false)
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="refund-reason">
          রিফান্ডের কারণ <span className="text-destructive">*</span>
        </Label>
        <Textarea
          disabled={pending}
          id="refund-reason"
          onChange={(event) => setReason(event.target.value)}
          placeholder="কেন রিফান্ড চাইছেন, সংক্ষেপে লিখুন…"
          required
          rows={4}
          value={reason}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-foreground" role="status">
          রিফান্ড রিকোয়েস্ট জমা হয়েছে। অ্যাডমিন সিদ্ধান্ত নিলে এখানেই
          স্ট্যাটাস দেখা যাবে।
        </p>
      ) : null}
      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
        disabled={pending}
        type="submit"
      >
        {pending ? "জমা হচ্ছে…" : "রিফান্ড রিকোয়েস্ট পাঠান"}
      </button>
    </form>
  )
}
