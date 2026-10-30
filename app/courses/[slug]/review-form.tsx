"use client"

import { useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"

import type { CourseReviewDto } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { createCourseReviewAction, updateCourseReviewAction } from "./actions"

type ReviewFormState =
  | { kind: "anonymous" }
  | { kind: "logged-in"; canReview: boolean; review: CourseReviewDto | null }

const box = "rounded-xl border border-[#343943] bg-[#1B1F29] p-5"
const btnBrass =
  "inline-flex min-h-12 items-center justify-center rounded-lg bg-[#C9A15A] px-5 font-semibold text-[#12151C] transition-colors hover:bg-[#A88A4A] disabled:cursor-not-allowed disabled:opacity-60"
const btnLine =
  "inline-flex min-h-12 items-center justify-center rounded-lg border border-[#343943] px-5 font-semibold transition-colors hover:border-[#C9A15A] disabled:cursor-not-allowed disabled:opacity-60"

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
          className="rounded-md p-1.5 transition-colors hover:bg-white/5 disabled:opacity-60"
          disabled={disabled}
          key={star}
          onClick={() => onChange(star)}
          role="radio"
          type="button"
        >
          <Star
            aria-hidden
            className={cn(
              "size-8",
              star <= value
                ? "fill-[#C9A15A] text-[#C9A15A]"
                : "fill-transparent text-[#5b5e66]"
            )}
          />
        </button>
      ))}
    </div>
  )
}

/**
 * Review form for a logged-in student. Stars are mandatory: the form cannot
 * be submitted with text alone. An existing review is prefilled as an edit.
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
      <p className={`${box} text-[#A3A5AE]`}>
        রিভিউ দিতে{" "}
        <Link
          className="text-[#C9A15A] underline underline-offset-4"
          href={`/auth/login?next=${encodeURIComponent(`/courses/${slug}`)}`}
        >
          লগইন করুন
        </Link>
        ।
      </p>
    )
  }

  const existing = state.review

  if (!state.canReview && !existing) {
    return (
      <p className={`${box} text-[#A3A5AE]`}>
        শুধুমাত্র এই কোর্সে এনরোল করা শিক্ষার্থীরা রিভিউ দিতে পারে।
      </p>
    )
  }

  if (existing && !editing) {
    return (
      <div className={`${box} space-y-3`}>
        <p className="text-sm text-[#A3A5AE]">আপনার রিভিউ</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              aria-hidden
              className={cn(
                "size-5",
                star <= existing.rating
                  ? "fill-[#C9A15A] text-[#C9A15A]"
                  : "fill-transparent text-[#5b5e66]"
              )}
              key={star}
            />
          ))}
        </div>
        {existing.body ? <p>{existing.body}</p> : null}
        <button
          className={btnLine}
          onClick={() => {
            setRating(existing.rating)
            setBody(existing.body ?? "")
            setEditing(true)
          }}
          type="button"
        >
          রিভিউ সম্পাদনা করুন
        </button>
      </div>
    )
  }

  const isEdit = existing !== null

  return (
    <form
      className={`${box} space-y-5`}
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
            caught instanceof Error
              ? caught.message
              : "রিভিউ জমা দেওয়া যায়নি।"
          )
        } finally {
          setPending(false)
        }
      }}
    >
      <p className="text-sm text-[#A3A5AE]">
        {isEdit ? "আপনার রিভিউ সম্পাদনা করুন" : "আপনার রিভিউ লিখুন"}
      </p>
      <div className="space-y-1">
        <p className="font-medium">
          রেটিং <span className="text-[#E58A81]">*</span>
        </p>
        <StarInput disabled={pending} onChange={setRating} value={rating} />
      </div>
      <div className="space-y-1.5">
        <label className="font-medium" htmlFor="review-body">
          মন্তব্য (ঐচ্ছিক)
        </label>
        <Textarea
          className="border-[#343943] bg-[#12151C] text-[#F2EFE7]"
          disabled={pending}
          id="review-body"
          onChange={(event) => setBody(event.target.value)}
          placeholder="কোর্সটি সম্পর্কে আপনার অভিজ্ঞতা লিখুন…"
          rows={4}
          value={body}
        />
      </div>
      {error ? (
        <p className="text-sm text-[#E58A81]" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-[#7FB8A8]" role="status">
          রিভিউ সংরক্ষিত হয়েছে।
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button className={btnBrass} disabled={pending} type="submit">
          {pending
            ? "জমা হচ্ছে…"
            : isEdit
              ? "রিভিউ আপডেট করুন"
              : "রিভিউ জমা দিন"}
        </button>
        {isEdit ? (
          <button
            className={btnLine}
            disabled={pending}
            onClick={() => setEditing(false)}
            type="button"
          >
            বাতিল
          </button>
        ) : null}
      </div>
    </form>
  )
}
