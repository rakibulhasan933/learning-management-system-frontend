"use client"

import { useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"

import type { CourseReviewDto } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import {
  createCourseReviewAction,
  updateCourseReviewAction,
} from "./actions"

type ReviewFormState =
  | { kind: "anonymous" }
  | { kind: "logged-in"; canReview: boolean; review: CourseReviewDto | null }

function StarInput({
  disabled,
  onChange,
  value,
}: {
  disabled: boolean
  onChange: (rating: number) => void
  value: number
}) {
  return (
    <div
      aria-label="স্টার রেটিং"
      className="flex items-center gap-1"
      role="radiogroup"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          aria-checked={value === star}
          aria-label={`${star} স্টার`}
          className="rounded p-1 transition-colors hover:bg-accent disabled:opacity-60"
          disabled={disabled}
          key={star}
          onClick={() => onChange(star)}
          role="radio"
          type="button"
        >
          <Star
            className={cn(
              "size-7",
              star <= value
                ? "fill-primary text-primary"
                : "fill-transparent text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  )
}

/**
 * Review form for a logged-in student. Stars are mandatory: the form cannot
 * be submitted with text alone. When the student already has a review, the
 * form is prefilled as an edit form.
 */
export function ReviewForm({
  courseId,
  slug,
  state,
}: {
  courseId: string
  slug: string
  state: ReviewFormState
}) {
  const [rating, setRating] = useState<number>(0)
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)

  if (state.kind === "anonymous") {
    return (
      <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
        রিভিউ দিতে{" "}
        <Link
          className="text-primary underline-offset-4 hover:underline"
          href={`/auth/login?next=${encodeURIComponent(`/courses/${slug}`)}`}
        >
          লগইন করুন
        </Link>
        ।
      </div>
    )
  }

  const existing = state.review

  if (!state.canReview && !existing) {
    return (
      <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
        শুধুমাত্র এই কোর্সে এনরোল করা শিক্ষার্থীরা রিভিউ দিতে পারে।
      </p>
    )
  }

  if (existing && !editing) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-background p-4">
        <p className="font-mono text-xs text-muted-foreground">আপনার রিভিউ</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              className={cn(
                "size-4",
                star <= existing.rating
                  ? "fill-primary text-primary"
                  : "fill-transparent text-muted-foreground"
              )}
              key={star}
            />
          ))}
        </div>
        {existing.body ? (
          <p className="text-sm leading-6">{existing.body}</p>
        ) : null}
        <Button
          onClick={() => {
            setRating(existing.rating)
            setBody(existing.body ?? "")
            setEditing(true)
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          রিভিউ সম্পাদনা করুন
        </Button>
      </div>
    )
  }

  const isEdit = existing !== null

  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-background p-4"
      onSubmit={async (event) => {
        event.preventDefault()
        setError(null)
        setSaved(false)
        if (rating < 1) {
          setError("অনুগ্রহ করে স্টার রেটিং দিন — শুধু লেখা জমা হবে না।")
          return
        }
        setPending(true)
        try {
          const formData = new FormData()
          formData.set("rating", String(rating))
          formData.set("body", body.trim())
          if (isEdit) {
            await updateCourseReviewAction(courseId, slug, formData)
          } else {
            await createCourseReviewAction(courseId, slug, formData)
          }
          setSaved(true)
          setEditing(false)
        } catch (caught) {
          setError(
            caught instanceof Error ? caught.message : "রিভিউ জমা দেওয়া যায়নি।"
          )
        } finally {
          setPending(false)
        }
      }}
    >
      <p className="font-mono text-xs text-muted-foreground">
        {isEdit ? "আপনার রিভিউ সম্পাদনা করুন" : "আপনার রিভিউ লিখুন"}
      </p>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          রেটিং <span className="text-destructive">*</span>
        </p>
        <StarInput
          disabled={pending}
          onChange={setRating}
          value={rating}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="review-body">
          মন্তব্য (ঐচ্ছিক)
        </label>
        <Textarea
          disabled={pending}
          id="review-body"
          onChange={(event) => setBody(event.target.value)}
          placeholder="কোর্সটি সম্পর্কে আপনার অভিজ্ঞতা লিখুন…"
          rows={4}
          value={body}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-muted-foreground" role="status">
          রিভিউ সংরক্ষিত হয়েছে।
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "জমা হচ্ছে…" : isEdit ? "রিভিউ আপডেট করুন" : "রিভিউ জমা দিন"}
        </Button>
        {isEdit ? (
          <Button
            disabled={pending}
            onClick={() => setEditing(false)}
            type="button"
            variant="ghost"
          >
            বাতিল
          </Button>
        ) : null}
      </div>
    </form>
  )
}
