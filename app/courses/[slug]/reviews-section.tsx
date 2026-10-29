import { cookies } from "next/headers"
import { MessageCircle, Star } from "lucide-react"

import type {
  CourseMyReviewResponse,
  CourseReviewDto,
  CourseReviewsResponse,
} from "@/lib/types"
import {
  accessTokenCookieName,
  optionalAuthenticatedApiFetch,
  publicApiFetch,
} from "@/lib/api-client"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

import { ReviewForm } from "./review-form"
import { ReviewHideButton, ReviewReplyForm } from "./review-staff-actions"

/** Five stars, filled up to the rounded rating. Never invented: only renders. */
export function RatingStars({ rating, size = "size-4" }: { rating: number; size?: string }) {
  const rounded = Math.round(rating)
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          className={cn(
            size,
            star <= rounded
              ? "fill-primary text-primary"
              : "fill-transparent text-muted-foreground"
          )}
          key={star}
        />
      ))}
    </span>
  )
}

function toBnDigits(value: string) {
  return value.replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)])
}

function ReviewCard({
  review,
  slug,
  viewerRole,
}: {
  review: CourseReviewDto
  slug: string
  viewerRole: string | null
}) {
  const canReply = viewerRole === "admin" || viewerRole === "instructor"
  const canHide = viewerRole === "admin"
  return (
    <article className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{review.reviewerName}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {formatDateTime(review.createdAt)}
        </p>
      </div>
      <div className="mt-2">
        <RatingStars rating={review.rating} />
      </div>
      {review.body ? (
        <p className="mt-2 text-sm leading-6">{review.body}</p>
      ) : null}
      {review.replies.length > 0 ? (
        <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
          {review.replies.map((reply) => (
            <div
              className="rounded-lg bg-card px-3 py-2"
              key={reply.id}
            >
              <p className="font-mono text-xs text-muted-foreground">
                {reply.authorRole === "instructor" ? "শিক্ষকের উত্তর" : "অ্যাডমিনের উত্তর"}
                {reply.authorName ? ` · ${reply.authorName}` : ""}
                {" · "}
                {formatDateTime(reply.createdAt)}
              </p>
              <p className="mt-1 text-sm leading-6">{reply.body}</p>
            </div>
          ))}
        </div>
      ) : null}
      {canReply ? (
        <ReviewReplyForm reviewId={review.id} slug={slug} />
      ) : null}
      {canHide ? (
        <ReviewHideButton reviewId={review.id} slug={slug} />
      ) : null}
    </article>
  )
}

/**
 * Reviews section for the public course sales page. Data comes only from
 * GET /courses/:courseId/reviews; nothing is invented. When the backend has
 * no reviews table or no reviews, the original "এখনো রিভিউ নেই" stands.
 */
export async function CourseReviewsSection({
  courseId,
  slug,
  fallbackAverage,
  fallbackCount,
}: {
  courseId: string
  slug: string
  fallbackAverage?: number | null
  fallbackCount?: number
}) {
  let data: CourseReviewsResponse | null = null
  let mine: CourseMyReviewResponse | null = null

  try {
    data = await publicApiFetch<CourseReviewsResponse>(
      `/courses/${courseId}/reviews`,
      { cache: "no-store" }
    )
  } catch {
    data = null
  }

  const cookieStore = await cookies()
  const hasToken = Boolean(cookieStore.get(accessTokenCookieName)?.value)
  let viewerRole: string | null = null
  if (hasToken) {
    try {
      mine = await optionalAuthenticatedApiFetch<CourseMyReviewResponse>(
        `/courses/${courseId}/reviews/mine`,
        { cache: "no-store" }
      )
    } catch {
      mine = null
    }
    // Staff-only UI (instructor reply, admin hide) needs the viewer role.
    // The backend still enforces ownership, so a wrong guess here cannot
    // grant anything.
    try {
      const me = await optionalAuthenticatedApiFetch<{ role?: string }>(
        "/auth/me",
        { cache: "no-store" }
      )
      viewerRole = me?.role ?? null
    } catch {
      viewerRole = null
    }
  }

  const averageRating = data?.averageRating ?? fallbackAverage ?? null
  const reviewCount = data?.reviewCount ?? fallbackCount ?? 0
  const reviews = data?.reviews ?? []

  return (
    <div className="space-y-5">
      {reviews.length === 0 ? (
        <p className="text-sm leading-6 text-muted-foreground">
          এখনো রিভিউ নেই
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {averageRating !== null ? (
              <>
                <RatingStars rating={averageRating} size="size-5" />
                <p className="font-mono text-lg tabular-nums">
                  {toBnDigits(averageRating.toFixed(1))}
                </p>
              </>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {toBnDigits(String(reviewCount))}টি রিভিউ
            </p>
          </div>
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                slug={slug}
                viewerRole={viewerRole}
              />
            ))}
          </div>
        </>
      )}

      <div className="pt-2">
        <h3 className="mb-3 flex items-center gap-2 font-heading text-lg tracking-tight">
          <MessageCircle className="size-5 text-primary" />
          রিভিউ দিন
        </h3>
        <ReviewForm
          courseId={courseId}
          slug={slug}
          state={
            !hasToken
              ? { kind: "anonymous" }
              : {
                  kind: "logged-in",
                  canReview: mine?.canReview ?? false,
                  review: mine?.review ?? null,
                }
          }
        />
      </div>
    </div>
  )
}
