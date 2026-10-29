import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import type { Metadata } from "next"
import {
  Clock3,
  ClipboardCheck,
  CalendarDays,
  FileText,
  HelpCircle,
  Lock,
  MessageCircle,
  PlayCircle,
} from "lucide-react"
import type {
  CourseDetailDto,
  CourseEnrollmentStatusResponse,
} from "@/lib/types"

import {
  accessTokenCookieName,
  ApiClientError,
  getBackendApiUrl,
  optionalAuthenticatedApiFetch,
  publicApiFetch,
} from "@/lib/api-client"
import { MarkdownContent } from "@/components/markdown-content"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressThread } from "@/components/ui/progress-thread"

import { PublicShell } from "@/components/public-shell"
import { RefCapture } from "@/components/ref-capture"

import { PreviewVideoPlayer } from "./preview-video-player"
import { CourseReviewsSection } from "./reviews-section"

export const dynamic = "force-dynamic"

function enrollmentIsOpen(course: CourseDetailDto) {
  return (
    course.enrollmentEnabled !== false &&
    (!course.enrollmentEndsAt || new Date(course.enrollmentEndsAt) > new Date())
  )
}

function formatEnrollmentDate(value: string | null) {
  if (!value) return "সমাপ্তির তারিখ নেই"
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

interface CourseDetailPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    error?: string
  }>
}

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  try {
    const course = await publicApiFetch<CourseDetailDto>(
      `/courses/${(await params).slug}`
    )
    return {
      title: course.title,
      description:
        course.shortDescription ??
        course.description ??
        `Learn ${course.title} with Folio.`,
      openGraph: {
        description:
          course.shortDescription ??
          course.description ??
          `Learn ${course.title} with Folio.`,
        images: course.thumbnailUrl ? [course.thumbnailUrl] : undefined,
        title: course.title,
        type: "article",
      },
    }
  } catch {
    return { title: "Course" }
  }
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

async function getEnrollmentStatus(slug: string) {
  try {
    return await optionalAuthenticatedApiFetch<CourseEnrollmentStatusResponse>(
      `/courses/${slug}/enrollment-status`,
      { cache: "no-store" }
    )
  } catch {
    return null
  }
}

function formatPrice(currency: string, price: string) {
  return Number(price) === 0 ? "ফ্রি" : `${currency === "BDT" ? "৳" : currency} ${Number(price).toLocaleString("bn-BD")}`
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds <= 0) {
    return null
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.round((totalSeconds % 3600) / 60)

  return hours > 0 ? `${hours} ঘণ্টা ${minutes} মিনিট` : `${minutes} মিনিট`
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: CourseDetailPageProps) {
  const { slug } = await params
  const { error } = await searchParams
  let course: CourseDetailDto
  try {
    course = await publicApiFetch<CourseDetailDto>(`/courses/${slug}`, {
      cache: "no-store",
    })
  } catch (fetchError) {
    if (fetchError instanceof ApiClientError && fetchError.status === 404) {
      notFound()
    }
    throw fetchError
  }

  const [viewerEmail, enrollmentStatus] = await Promise.all([
    getOptionalViewerEmail(),
    getEnrollmentStatus(slug),
  ])

  // Defensive: the page must never crash on an unexpected payload shape.
  const sections = Array.isArray(course.sections) ? course.sections : []
  const sortedSections = [...sections].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  )
  const totalModules = sections.reduce(
    (sum, section) =>
      sum + (Array.isArray(section.modules) ? section.modules.length : 0),
    0
  )
  const totalLectures = sections.reduce(
    (sum, section) =>
      sum + (Array.isArray(section.lectures) ? section.lectures.length : 0),
    0
  )
  const totalDuration = formatDuration(
    sections.reduce(
      (sum, section) =>
        sum +
        (Array.isArray(section.modules)
          ? section.modules.reduce(
              (moduleSum, module) =>
                moduleSum + (module.durationSeconds ?? 0),
              0
            )
          : 0),
      0
    )
  )

  const isEnrolled = enrollmentStatus?.isEnrolled ?? false
  const canEnroll = enrollmentIsOpen(course)
  const isAuthenticated = enrollmentStatus?.isAuthenticated ?? false
  const openOrder = isEnrolled ? null : (enrollmentStatus?.latestOrder ?? null)
  const pendingOrder =
    openOrder?.status === "pending_verification" ? openOrder : null
  const rejectedOrder = openOrder?.status === "rejected" ? openOrder : null
  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.shortDescription ?? course.description,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://folio.example.com"}/courses/${slug}`,
    image: course.thumbnailUrl ? [course.thumbnailUrl] : undefined,
    provider: { "@type": "Organization", name: "Folio" },
    instructor: course.instructorName
      ? { "@type": "Person", name: course.instructorName }
      : undefined,
  }

  return (
    <PublicShell>
      <Suspense fallback={null}>
        <RefCapture />
      </Suspense>
      <main className="px-4 py-8 sm:px-6 sm:py-12">
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
          type="application/ld+json"
        />
        <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <ProgressThread className="mb-8" />

            {course.thumbnailUrl ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
                <Image
                  alt={course.title}
                  className="object-cover"
                  fill
                  priority
                  sizes="(min-width: 1024px) 720px, 100vw"
                  src={course.thumbnailUrl}
                />
              </div>
            ) : null}

            <p className="mt-8 font-mono text-xs tracking-wide text-muted-foreground">
              {course.category ?? "General"} · {course.level.replace("_", " ")}
            </p>
            <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-[1.1] tracking-tight sm:text-5xl">
              {course.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              {course.shortDescription}
            </p>
            {/* At-a-glance facts: only counts derived from the real course
                payload. No enrolment count, seats, rating, or review figure
                is shown here because the public course API returns none. */}
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              {[
                sortedSections.length > 0
                  ? `${sortedSections.length} milestones`
                  : null,
                totalModules > 0 ? `${totalModules} modules` : null,
                totalLectures > 0 ? `${totalLectures} lessons` : null,
                totalDuration,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="#curriculum"
              >
                কারিকুলাম দেখুন
              </a>
              {course.instructorName ? (
                <a
                  className="text-primary underline-offset-4 hover:underline"
                  href="#instructor"
                >
                  মেন্টর
                </a>
              ) : null}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="#reviews"
              >
                রিভিউ
              </a>
            </div>
            {course.instructorName ? (
              <p className="mt-4 text-sm text-muted-foreground">
                মেন্টর: {" "}
                <span className="text-foreground">{course.instructorName}</span>
              </p>
            ) : null}

            <div className="mt-12 space-y-5">
              <h2 className="font-heading text-2xl tracking-tight">
                এই কোর্সে যা শিখবেন
              </h2>
              <MarkdownContent
                className="max-w-2xl"
                fallback="Course details will be added soon."
              >
                {course.description}
              </MarkdownContent>
            </div>

            <PreviewVideoPlayer
              learnerEmail={viewerEmail}
              sections={sections}
            />

            {sortedSections.length > 0 ? (
            <div className="mt-12 scroll-mt-8 space-y-4" id="curriculum">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-heading text-2xl tracking-tight">
                  কোর্সের আউটলাইন
                </h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {sortedSections.length} milestones · {totalModules} modules
                  {totalLectures > 0 ? ` · ${totalLectures} lessons` : ""}
                  {totalDuration ? ` · ${totalDuration}` : ""}
                </span>
              </div>
              {sortedSections.map((section) => (
                <Card key={section.id} size="sm">
                  <CardContent className="space-y-3">
                    <p className="font-mono text-xs text-muted-foreground">
                      Milestone {section.position + 1}
                    </p>
                    <h3 className="font-heading text-lg tracking-tight">
                      {section.title}
                    </h3>
                    <div className="space-y-0.5">
                      {(section.modules ?? [])
                        .slice()
                        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                        .map((module) => {
                        const contentTypes = Array.isArray(module.contentTypes)
                          ? module.contentTypes
                          : []
                        const ContentIcon = contentTypes.includes(
                          "video"
                        )
                          ? PlayCircle
                          : contentTypes.includes("pdf")
                            ? FileText
                            : contentTypes.includes("quiz")
                              ? HelpCircle
                              : ClipboardCheck
                        const contentLabel = contentTypes
                          .map((type) =>
                            type === "video"
                              ? module.videoCount === 1
                                ? "Video"
                                : `${module.videoCount} videos`
                              : type === "pdf"
                                ? "PDF"
                                : type === "quiz"
                                  ? "Quiz"
                                  : "Assignment"
                          )
                          .join(" + ")
                        return (
                          <div
                            className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-background"
                            key={module.id}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              {isEnrolled ||
                              contentTypes.includes("video") ? (
                                <ContentIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                              ) : (
                                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                              )}
                              <span className="truncate">{module.title}</span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              {module.durationSeconds ? (
                                <span className="font-mono text-xs text-muted-foreground/80">
                                  {Math.round(module.durationSeconds / 60)}m
                                </span>
                              ) : null}
                              <Badge
                                className="border-primary/40 bg-primary/10 font-mono text-[11px] text-primary"
                                variant="outline"
                              >
                                {contentLabel}
                              </Badge>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    {/* Lessons are listed separately because the public
                        course payload returns lectures per milestone, not
                        grouped under a module. Order is position order. */}
                    {(section.lectures ?? []).length > 0 ? (
                      <div className="space-y-0.5 border-t border-border pt-3">
                        {(section.lectures ?? [])
                          .slice()
                          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                          .map((lecture) => (
                            <div
                              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground"
                              key={lecture.id}
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                {lecture.isPreview ? (
                                  <PlayCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
                                ) : (
                                  <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                                )}
                                <span className="truncate">
                                  {lecture.title}
                                </span>
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                {lecture.durationSeconds ? (
                                  <span className="font-mono text-xs text-muted-foreground/80">
                                    {Math.round(lecture.durationSeconds / 60)}m
                                  </span>
                                ) : null}
                                {lecture.isPreview ? (
                                  <Badge
                                    className="border-primary/40 bg-primary/10 font-mono text-[11px] text-primary"
                                    variant="outline"
                                  >
                                    ফ্রি প্রিভিউ
                                  </Badge>
                                ) : null}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
            ) : null}

            {course.instructorName ? (
              <section className="mt-12 scroll-mt-8 space-y-3" id="instructor">
                <h2 className="font-heading text-2xl tracking-tight">
                  মেন্টর
                </h2>
                <Card size="sm">
                  <CardContent>
                    <p className="text-base text-foreground">
                      {course.instructorName}
                    </p>
                    {/* No bio or avatar block: the public course API returns
                        only instructorName, so no bio, credential, or photo
                        is shown or invented here. */}
                  </CardContent>
                </Card>
              </section>
            ) : null}

            <section className="mt-12 scroll-mt-8 space-y-3" id="reviews">
              <h2 className="font-heading text-2xl tracking-tight">রিভিউ</h2>
              <CourseReviewsSection
                courseId={course.id}
                fallbackAverage={course.averageRating ?? null}
                fallbackCount={course.reviewCount ?? 0}
                slug={course.slug}
              />
            </section>
          </div>

          <aside className="h-fit lg:sticky lg:top-8">
            <Card className="gap-4">
              {course.thumbnailUrl ? (
                <div className="relative -mt-(--card-spacing) aspect-video overflow-hidden border-b border-border">
                  <Image
                    alt={course.title}
                    className="object-cover"
                    fill
                    priority
                    sizes="360px"
                    src={course.thumbnailUrl}
                  />
                </div>
              ) : null}
              <CardContent className="space-y-4">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    Enrollment
                  </p>
                  <p className="mt-2 font-mono text-3xl text-primary tabular-nums">
                    {formatPrice(course.currency, course.price)}
                  </p>
                </div>
                {/* Enrolment-end is shown ONLY when the API returns a real
                    enrollmentEndsAt value. No seats/capacity block exists:
                    the API returns no capacity field. */}
                {course.enrollmentEndsAt ? (
                  <div className="flex items-start gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      {new Date(course.enrollmentEndsAt) > new Date()
                        ? `Enrollment closes ${formatEnrollmentDate(course.enrollmentEndsAt)}`
                        : `Enrollment ended ${formatEnrollmentDate(course.enrollmentEndsAt)}`}
                    </span>
                  </div>
                ) : null}

                {error ? (
                  <p
                    className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}

                {isEnrolled ? (
                  <div className="space-y-3">
                    <p className="text-sm leading-6 text-muted-foreground">
                      You are enrolled in this course. Pick up where you left
                      off.
                    </p>
                    <Button
                      className="w-full"
                      // render={<Link href={`/learn/${course.id}`} />}
                      size="lg"
                      asChild
                    >
                      <Link href={`/learn/${course.id}`}>
                        Continue learning
                      </Link>
                    </Button>
                    <Button className="w-full" size="lg" variant="outline" asChild>
                      <Link
                        href={`/dashboard/student/messages/new?courseId=${course.id}&title=${encodeURIComponent(course.title)}`}
                      >
                        <MessageCircle className="size-4" />
                        শিক্ষককে মেসেজ করুন
                      </Link>
                    </Button>
                  </div>
                ) : pendingOrder ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm text-muted-foreground">
                      <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <p>
                        Payment under review. Enrollment activates once PayConfirm
                        verifies your transaction.
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      variant="outline"
                      asChild
                    >
                      <Link
                        href={`/checkout/bkash?order_id=${pendingOrder.id}`}
                      >
                        View payment status
                      </Link>
                    </Button>
                  </div>
                ) : rejectedOrder ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                      <p>Your payment proof was rejected.</p>
                      {rejectedOrder.rejectionReason ? (
                        <p className="mt-1 text-destructive/90">
                          {rejectedOrder.rejectionReason}
                        </p>
                      ) : null}
                    </div>
                    <Button className="w-full" size="lg" asChild>
                      <Link
                        href={`/checkout/bkash?order_id=${rejectedOrder.id}`}
                      >
                        Resubmit payment proof
                      </Link>
                    </Button>
                  </div>
                ) : !canEnroll ? (
                  <p className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground">
                    Enrollment is not available for this course right now.
                  </p>
                ) : isAuthenticated ? (
                  <div className="space-y-3">
                    <Button className="w-full" size="lg" asChild>
                      <Link href={`/courses/${course.slug}/checkout`}>
                        Enroll
                      </Link>
                    </Button>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Paid courses use automatic payment verification.
                      Enrollment activates after the transaction is approved by
                      Pay-Confirm.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Sign in to enroll. Paid courses use automatic payment
                      verification through Pay-Confirm.
                    </p>
                    <Button asChild className="w-full" size="lg">
                      <Link
                        href={`/auth/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`}
                      >
                        Sign in to enroll
                      </Link>
                    </Button>
                  </div>
                )}
                <Button className="mt-3 w-full" size="lg" variant="outline" asChild>
                  <Link href="/bundles">
                    একাধিক কোর্স একসাথে চাইলে বান্ডেল দেখুন
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
    </PublicShell>
  )
}
