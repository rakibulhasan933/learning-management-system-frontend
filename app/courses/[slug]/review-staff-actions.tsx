"use client"

import { useState } from "react"
import { EyeOff, Reply } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

import { replyToReviewAction, setReviewVisibilityAction } from "./actions"

/**
 * Reply form shown to the course instructor and admins under a review.
 * The backend enforces that an instructor can only reply on their own
 * course; a 403 from the backend is surfaced as-is.
 */
export function ReviewReplyForm({
  reviewId,
  slug,
}: {
  reviewId: string
  slug: string
}) {
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button
        className="mt-3"
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="outline"
      >
        <Reply className="size-4" />
        উত্তর দিন
      </Button>
    )
  }

  return (
    <form
      className="mt-3 space-y-3 rounded-lg border border-border/60 bg-card/50 p-3"
      onSubmit={async (event) => {
        event.preventDefault()
        setError(null)
        if (!body.trim()) {
          setError("উত্তরের লেখা খালি রাখা যাবে না।")
          return
        }
        setPending(true)
        try {
          const formData = new FormData()
          formData.set("body", body.trim())
          await replyToReviewAction(reviewId, slug, formData)
          setBody("")
          setOpen(false)
        } catch (caught) {
          setError(
            caught instanceof Error ? caught.message : "উত্তর পাঠানো যায়নি।"
          )
        } finally {
          setPending(false)
        }
      }}
    >
      <label
        className="font-mono text-xs text-muted-foreground"
        htmlFor={`reply-${reviewId}`}
      >
        রিভিউয়ের উত্তর লিখুন
      </label>
      <Textarea
        disabled={pending}
        id={`reply-${reviewId}`}
        onChange={(event) => setBody(event.target.value)}
        placeholder="শিক্ষার্থীর রিভিউয়ের উত্তর…"
        rows={3}
        value={body}
      />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button disabled={pending} size="sm" type="submit">
          {pending ? "পাঠানো হচ্ছে…" : "উত্তর পাঠান"}
        </Button>
        <Button
          disabled={pending}
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          size="sm"
          type="button"
          variant="ghost"
        >
          বাতিল
        </Button>
      </div>
    </form>
  )
}

/**
 * Admin-only hide button for a review. Reviews are hidden, never deleted.
 */
export function ReviewHideButton({
  reviewId,
  slug,
}: {
  reviewId: string
  slug: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <div className="mt-3">
      <Button
        disabled={pending}
        onClick={async () => {
          setError(null)
          setPending(true)
          try {
            await setReviewVisibilityAction(reviewId, slug, true)
          } catch (caught) {
            setError(
              caught instanceof Error ? caught.message : "রিভিউ লুকানো যায়নি।"
            )
            setPending(false)
          }
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        <EyeOff className="size-4" />
        {pending ? "লুকানো হচ্ছে…" : "রিভিউ লুকান"}
      </Button>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        লুকানো রিভিউ ডিলিট হয় না, শুধু পাবলিক তালিকা থেকে সরে যায়।
      </p>
    </div>
  )
}
