import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import type { CourseDetailDto, ProfileDto } from "@workspace/types"

import {
  ApiClientError,
  authenticatedApiFetch,
  publicApiFetch,
} from "@/lib/api-client"
import { CouponCheckoutForm } from "./coupon-checkout-form"
import { Card, CardContent } from "@workspace/ui/components/card"
import { ProgressThread } from "@workspace/ui/components/progress-thread"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  try {
    const course = await publicApiFetch<CourseDetailDto>(
      `/courses/${(await params).slug}`
    )
    return { title: `Checkout · ${course.title}` }
  } catch {
    return { title: "Course checkout" }
  }
}

export default async function CourseCheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let profile: ProfileDto
  try {
    profile = await authenticatedApiFetch<ProfileDto>("/auth/me", {
      cache: "no-store",
    })
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401)
      redirect(
        `/auth/login?next=${encodeURIComponent(`/courses/${slug}/checkout`)}`
      )
    throw error
  }
  const course = await publicApiFetch<CourseDetailDto>(`/courses/${slug}`, {
    cache: "no-store",
  })
  const isFree = Number(course.price) === 0

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <section className="mx-auto max-w-5xl">
        <ProgressThread className="mb-8" />
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          href={`/courses/${slug}`}
        >
          ← Back to course
        </Link>
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <Card>
            <CardContent>
              <p className="font-mono text-xs text-muted-foreground">
                Step 1 · Checkout
              </p>
              <h1 className="mt-3 font-heading text-4xl tracking-tight">
                Complete your enrollment
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                Apply a coupon if you have one. The final amount is calculated
                and recorded by the server before payment.
              </p>
              <CouponCheckoutForm
                courseId={course.id}
                currency={course.currency}
                isFree={isFree}
                originalAmount={course.price}
                slug={slug}
              />
              <p className="mt-5 text-xs text-muted-foreground">
                Signed in as {profile.email}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              {course.thumbnailUrl ? (
                <div className="relative aspect-video overflow-hidden rounded-xl bg-card">
                  <Image
                    alt={course.title}
                    className="object-cover"
                    fill
                    sizes="360px"
                    src={course.thumbnailUrl}
                  />
                </div>
              ) : null}
              <p className="mt-5 font-mono text-xs text-muted-foreground">
                Course summary
              </p>
              <h2 className="mt-2 font-heading text-2xl tracking-tight">
                {course.title}
              </h2>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">
                  Listed price
                </span>
                <span className="font-mono text-xl text-primary">
                  {isFree ? "Free" : `${course.currency} ${course.price}`}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
