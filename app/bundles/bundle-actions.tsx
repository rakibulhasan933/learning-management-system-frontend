"use client"

import { useState } from "react"

import { createBundleOrderAction, createSubscriptionAction } from "./actions"
import { REF_STORAGE_KEY } from "@/components/ref-capture"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function BundleBuyButton({ bundleId }: { bundleId: string }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        disabled={pending}
        onClick={async () => {
          setPending(true)
          setError(null)
          try {
            let refCode: string | undefined
            try {
              refCode =
                window.localStorage.getItem(REF_STORAGE_KEY) ?? undefined
            } catch {
              refCode = undefined
            }
            await createBundleOrderAction(bundleId, refCode)
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Bundle order could not be created."
            )
            setPending(false)
          }
        }}
      >
        {pending ? "অর্ডার তৈরি হচ্ছে…" : "বান্ডেল কিনুন"}
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        কেনার পর বিদ্যমান PayConfirm প্রমাণ ফ্লোতে (sender number +
        Transaction ID) পেমেন্ট যাচাই হবে।
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

export function BundleSubscribeForm({ bundleId }: { bundleId: string }) {
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="space-y-2 rounded-xl border border-border p-3"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        const data = new FormData(event.currentTarget)
        const months = Number(data.get("months"))
        if (!Number.isInteger(months) || months < 1 || months > 24) {
          setError("মেয়াদ ১ থেকে ২৪ মাসের মধ্যে হতে হবে।")
          return
        }
        void createSubscriptionAction(data).catch((caught: unknown) => {
          setError(
            caught instanceof Error
              ? caught.message
              : "Subscription could not be started."
          )
        })
      }}
    >
      <input name="targetType" type="hidden" value="bundle" />
      <input name="targetId" type="hidden" value={bundleId} />
      <Label htmlFor={`months-${bundleId}`}>সাবস্ক্রিপশন (মাস)</Label>
      <div className="flex gap-2">
        <Input
          defaultValue={1}
          id={`months-${bundleId}`}
          max={24}
          min={1}
          name="months"
          type="number"
        />
        <Button type="submit">শুরু করুন</Button>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        মূল্য বান্ডেলের তালিকাভুক্ত মূল্যই থাকবে পুরো মেয়াদের জন্য; মাস শুধু
        অ্যাক্সেসের মেয়াদ নির্ধারণ করে, মাসপ্রতি আলাদা চার্জ নয়।
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  )
}
