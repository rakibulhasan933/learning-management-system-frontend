import Image from "next/image"
import Link from "next/link"
import { cookies } from "next/headers"
import type { Metadata } from "next"
import { Clock3, ClipboardCheck, FileText, HelpCircle, Lock, PlayCircle } from "lucide-react"
import type {
  CourseDetailDto,
  CourseEnrollmentStatusResponse,
} from "@workspace/types"

import {
  accessTokenCookieName,
  getBackendApiUrl,
  optionalAuthenticatedApiFetch,
  publicApiFetch,
} from "@/lib/api-client"
import { MarkdownContent } from "@/components/markdown-content"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { ProgressThread } from "@workspace/ui/components/progress-thread"

import { PreviewVideoPlayer } from "./preview-video-player"

export const dynamic = "force-dynamic"

interface CourseDetailPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    error?: string
  }>
}

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  try {
    const course = await publicApiFetch<CourseDetailDto>(`/courses/${(await params).slug}`)
    return {
      title: course.title,
      description: course.shortDescription ?? course.description ?? `Learn ${course.title} with Folio.`,
      openGraph: {
        description: course.shortDescription ?? course.description ?? `Learn ${course.title} with Folio.`,
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
      { cache: "no-store" },
    )
  } catch {
    return null
  }
}

function formatPrice(currency: string, price: string) {
  return Number(price) === 0 ? "Free" : `${currency} ${price}`
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds <= 0) {
    return null
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.round((totalSeconds % 3600) / 60)

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: CourseDetailPageProps) {
  const { slug } = await params
  const { error } = await searchParams
  const [course, viewerEmail, enrollmentStatus] = await Promise.all([
    publicApiFetch<CourseDetailDto>(`/courses/${slug}`, {
      cache: "no-store",
    }),
    getOptionalViewerEmail(),
    getEnrollmentStatus(slug),
  ])

  const totalModules = course.sections.reduce(
    (sum, section) => sum + section.modules.length,
    0,
  )
  const totalDuration = formatDuration(
    course.sections.reduce(
      (sum, section) =>
        sum +
        section.modules.reduce((moduleSum, module) => moduleSum + module.durationSeconds, 0),
      0,
    ),
  )

  const isEnrolled = enrollmentStatus?.isEnrolled ?? false
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
    instructor: course.instructorName ? { "@type": "Person", name: course.instructorName } : undefined,
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} type="application/ld+json" />
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
          {course.instructorName ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Taught by{" "}
              <span className="text-foreground">{course.instructorName}</span>
            </p>
          ) : null}

          <div className="mt-12 space-y-5">
            <h2 className="font-heading text-2xl tracking-tight">
              What you will learn
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
            sections={course.sections}
          />

          <div className="mt-12 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-heading text-2xl tracking-tight">
                Course outline
              </h2>
              <span className="font-mono text-xs text-muted-foreground">
                {course.sections.length} milestones · {totalModules} modules
                {totalDuration ? ` · ${totalDuration}` : ""}
              </span>
            </div>
            {course.sections.map((section) => (
              <Card key={section.id} size="sm">
                <CardContent className="space-y-3">
                  <p className="font-mono text-xs text-muted-foreground">
                    Milestone {section.position + 1}
                  </p>
                  <h3 className="font-heading text-lg tracking-tight">
                    {section.title}
                  </h3>
                  <div className="space-y-0.5">
                    {section.modules.map((module) => {
                      const ContentIcon = module.contentTypes.includes("video") ? PlayCircle : module.contentTypes.includes("pdf") ? FileText : module.contentTypes.includes("quiz") ? HelpCircle : ClipboardCheck
                      const contentLabel = module.contentTypes.map((type) => type === "video" ? (module.videoCount === 1 ? "Video" : `${module.videoCount} videos`) : type === "pdf" ? "PDF" : type === "quiz" ? "Quiz" : "Assignment").join(" + ")
                      return (
                      <div
                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-background"
                        key={module.id}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {isEnrolled || module.contentTypes.includes("video") ? (
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
                          <Badge className="border-primary/40 bg-primary/10 font-mono text-[11px] text-primary" variant="outline">
                            {contentLabel}
                          </Badge>
                        </span>
                      </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <aside className="h-fit lg:sticky lg:top-8">
          <Card className="gap-4">
            {course.thumbnailUrl ? (
              <div className="relative -mt-(--card-spacing) aspect-video overflow-hidden border-b border-border">
                <Image
                  alt={course.title}
                  className="object-cover"
                  fill
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
                <p className="mt-2 font-mono text-3xl tabular-nums text-primary">
                  {formatPrice(course.currency, course.price)}
                </p>
              </div>

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
                    You are enrolled in this course. Pick up where you left off.
                  </p>
                  <Button
                    className="w-full"
                    // render={<Link href={`/learn/${course.id}`} />}
                    size="lg"
                   asChild>
                    <Link href={`/learn/${course.id}`}>
                      Continue learning
                    </Link>
                  </Button>
                </div>
              ) : pendingOrder ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm text-muted-foreground">
                    <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <p>
                      Payment under review. Enrollment activates once an admin
                      approves your proof.
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
                  <Button
                    className="w-full"
                    size="lg"
                    asChild
                  >
                    <Link
                      href={`/checkout/bkash?order_id=${rejectedOrder.id}`}
                    >
                      Resubmit payment proof
                    </Link>
                  </Button>
                </div>
              ) : isAuthenticated ? (
                <div className="space-y-3">
                  <Button className="w-full" size="lg" asChild>
                    <Link href={`/courses/${course.slug}/checkout`}>Enroll</Link>
                  </Button>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Paid courses use automatic payment verification. Enrollment
                    activates after the transaction is approved by Pay-Confirm.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Sign in to enroll. Paid courses use automatic payment
                    verification through Pay-Confirm.
                  </p>
                  <Link
                    href={`/auth/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`}
                  >
                    <Button
                      className="w-full"
                      size="lg"
                    >
                      Sign in to enroll
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  )
}
