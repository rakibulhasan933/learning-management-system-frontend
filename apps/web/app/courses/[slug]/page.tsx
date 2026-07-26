import Link from "next/link"
import { cookies } from "next/headers"
import type { CourseDetailDto } from "@workspace/types"

import { createEnrollmentOrderAction } from "@/app/courses/[slug]/enroll/actions"
import {
  accessTokenCookieName,
  getBackendApiUrl,
  publicApiFetch,
} from "@/lib/api-client"

import { PreviewVideoPlayer } from "./preview-video-player"

export const dynamic = "force-dynamic"

interface CourseDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getOptionalViewerEmail() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(accessTokenCookieName)?.value

  if (!accessToken) {
    return null
  }

  const response = await fetch(`${getBackendApiUrl()}/auth/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  }).catch(() => null)

  if (!response?.ok) {
    return null
  }

  const profile = (await response.json()) as { email?: string }

  return profile.email ?? null
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params
  const [course, viewerEmail] = await Promise.all([
    publicApiFetch<CourseDetailDto>(`/courses/${slug}`, {
      cache: "no-store",
    }),
    getOptionalViewerEmail(),
  ])

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <div>
          <div className="mb-8 h-px w-28 bg-primary" />
          <p className="font-mono text-sm text-muted-foreground">
            {course.category ?? "General"} · {course.level.replace("_", " ")}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl tracking-tight sm:text-5xl">
            {course.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            {course.shortDescription}
          </p>
          <div className="mt-10 space-y-5">
            <h2 className="text-2xl">What you will learn</h2>
            <p className="whitespace-pre-line leading-7 text-muted-foreground">
              {course.description ?? "Course details will be added soon."}
            </p>
          </div>
          <PreviewVideoPlayer
            learnerEmail={viewerEmail}
            sections={course.sections}
          />
          <div className="mt-10 space-y-4">
            <h2 className="text-2xl">Course outline</h2>
            {course.sections.map((section) => (
              <div className="border border-border bg-card p-4 sm:p-5" key={section.id}>
                <p className="font-mono text-xs text-muted-foreground">
                  Section {section.position + 1}
                </p>
                <h3 className="mt-2 text-xl">{section.title}</h3>
                <div className="mt-4 space-y-2">
                  {section.lectures.map((lecture) => (
                    <div
                      className="flex items-center justify-between text-sm text-muted-foreground"
                      key={lecture.id}
                    >
                      <span>{lecture.title}</span>
                      {lecture.isPreview ? <span>Free preview</span> : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit border border-border bg-card p-5 sm:p-6">
          <p className="font-mono text-sm text-muted-foreground">Enrollment</p>
          <p className="mt-4 text-3xl">
            {Number(course.price) === 0
              ? "Free"
              : `${course.currency} ${course.price}`}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Paid courses use manual payment verification. Enrollment activates
            after admin approval.
          </p>
          <form action={createEnrollmentOrderAction} className="mt-6 space-y-3">
            <input name="courseId" type="hidden" value={course.id} />
            <input name="slug" type="hidden" value={course.slug} />
            <label className="block text-sm">
              Coupon code
              <input
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                name="couponCode"
                placeholder="Optional"
              />
            </label>
            <button
              className="w-full bg-primary px-4 py-3 text-center text-sm text-primary-foreground"
              type="submit"
            >
              Enroll
            </button>
          </form>
          <Link
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground"
            href="/auth/login"
          >
            Sign in first
          </Link>
        </aside>
      </section>
    </main>
  )
}
