import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import type { Metadata } from "next"
import {
  Clock3,
  ClipboardCheck,
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
import { PublicShell } from "@/components/public-shell"
import { RefCapture } from "@/components/ref-capture"

import { PreviewVideoPlayer } from "./preview-video-player"
import { CourseReviewsSection } from "./reviews-section"

export const dynamic = "force-dynamic"

const bn = (n: number) => n.toLocaleString("bn-BD")

const levelLabels: Record<string, string> = {
  beginner: "শুরুর স্তর",
  intermediate: "মাঝারি স্তর",
  advanced: "অ্যাডভান্সড",
  all_levels: "সব স্তর",
}

const btnBrass =
  "flex min-h-13 w-full items-center justify-center gap-2 rounded-lg border border-[#C9A15A] bg-[#C9A15A] px-5 text-center font-semibold text-[#12151C] transition-colors hover:border-[#A88A4A] hover:bg-[#A88A4A]"
const btnLine =
  "flex min-h-13 w-full items-center justify-center gap-2 rounded-lg border border-[#343943] px-5 text-center font-semibold text-[#F2EFE7] transition-colors hover:border-[#C9A15A]"
const h2 = "text-2xl leading-[1.4] font-semibold text-balance sm:text-3xl"

function enrollmentIsOpen(course: CourseDetailDto) {
  return (
    course.enrollmentEnabled !== false &&
    (!course.enrollmentEndsAt || new Date(course.enrollmentEndsAt) > new Date())
  )
}

function formatEnrollmentDate(value: string | null) {
  if (!value) return "সমাপ্তির তারিখ নেই"
  return new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ error?: string }>
}

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  try {
    const course = await publicApiFetch<CourseDetailDto>(
      `/courses/${(await params).slug}`
    )
    const description =
      course.shortDescription ??
      course.description ??
      `Learn ${course.title} with Folio.`
    return {
      title: course.title,
      description,
      openGraph: {
        description,
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
  if (!accessToken) return null

  const response = await fetch(`${getBackendApiUrl()}/auth/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  }).catch(() => null)
  if (!response?.ok) return null

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
  return Number(price) === 0
    ? "ফ্রি"
    : `${currency === "BDT" ? "৳" : currency} ${bn(Number(price))}`
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds <= 0) return null
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.round((totalSeconds % 3600) / 60)
  return hours > 0
    ? `${bn(hours)} ঘণ্টা ${bn(minutes)} মিনিট`
    : `${bn(minutes)} মিনিট`
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
    (sum, s) => sum + (Array.isArray(s.modules) ? s.modules.length : 0),
    0
  )
  const totalLectures = sections.reduce(
    (sum, s) => sum + (Array.isArray(s.lectures) ? s.lectures.length : 0),
    0
  )
  const totalDuration = formatDuration(
    sections.reduce(
      (sum, s) =>
        sum +
        (Array.isArray(s.modules)
          ? s.modules.reduce((m, mod) => m + (mod.durationSeconds ?? 0), 0)
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

  // Only counts that really exist in the payload. No invented figures.
  const facts = [
    sortedSections.length > 0 ? `${bn(sortedSections.length)}টি ধাপ` : null,
    totalModules > 0 ? `${bn(totalModules)}টি মডিউল` : null,
    totalLectures > 0 ? `${bn(totalLectures)}টি লেসন` : null,
    totalDuration,
  ].filter(Boolean)

  return (
    <PublicShell variant="home">
      <Suspense fallback={null}>
        <RefCapture />
      </Suspense>
      <main className="bg-[#12151C] leading-[1.85] text-[#F2EFE7] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[#C9A15A] [&_summary:focus-visible]:outline-2 [&_summary:focus-visible]:outline-[#C9A15A]">
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
          type="application/ld+json"
        />
        <div className="mx-auto grid w-[min(1200px,calc(100%-2.5rem))] gap-12 py-10 sm:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div className="min-w-0">
            <p className="text-sm text-[#C9A15A]">
              {(course.category ?? "সাধারণ").replaceAll("-", " ")} ·{" "}
              {levelLabels[course.level] ?? course.level.replace("_", " ")}
            </p>
            <h1 className="mt-3 max-w-3xl text-[2.2rem] leading-[1.3] font-semibold text-balance sm:text-5xl">
              {course.title}
            </h1>
            {course.shortDescription ? (
              <p className="mt-5 max-w-2xl text-lg text-[#A3A5AE]">
                {course.shortDescription}
              </p>
            ) : null}
            {facts.length > 0 ? (
              <p className="mt-4 text-sm text-[#A3A5AE]">{facts.join(" · ")}</p>
            ) : null}
            {course.instructorName ? (
              <p className="mt-1 text-sm text-[#A3A5AE]">
                মেন্টর:{" "}
                <span className="text-[#F2EFE7]">{course.instructorName}</span>
              </p>
            ) : null}

            <a
              className="mt-6 flex min-h-13 items-center justify-between gap-3 rounded-lg border border-[#C9A15A] px-4 lg:hidden"
              href="#enroll"
            >
              <strong className="text-xl text-[#C9A15A]">
                {formatPrice(course.currency, course.price)}
              </strong>
              <span className="text-sm">ভর্তির তথ্য দেখুন</span>
            </a>

            {course.thumbnailUrl ? (
              <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-xl border border-[#343943] bg-[#1B1F29]">
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

            <nav
              aria-label="এই পৃষ্ঠার অংশ"
              className="mt-8 flex flex-wrap gap-x-6 gap-y-1 border-y border-[#343943] py-3 text-sm"
            >
              {sortedSections.length > 0 ? (
                <a
                  className="text-[#C9A15A] hover:underline"
                  href="#curriculum"
                >
                  কারিকুলাম
                </a>
              ) : null}
              {course.instructorName ? (
                <a
                  className="text-[#C9A15A] hover:underline"
                  href="#instructor"
                >
                  মেন্টর
                </a>
              ) : null}
              <a className="text-[#C9A15A] hover:underline" href="#reviews">
                রিভিউ
              </a>
            </nav>

            <section className="mt-12 space-y-5">
              <h2 className={h2}>এই কোর্সে যা শিখবেন</h2>
              <MarkdownContent
                className="max-w-2xl"
                fallback="কোর্সের বিস্তারিত শিগগিরই যোগ করা হবে।"
              >
                {course.description}
              </MarkdownContent>
            </section>

            <PreviewVideoPlayer
              learnerEmail={viewerEmail}
              sections={sections}
            />

            {sortedSections.length > 0 ? (
              <section className="mt-14 scroll-mt-8" id="curriculum">
                <h2 className={h2}>কোর্সের আউটলাইন</h2>
                <div className="mt-6 border-b border-[#343943]">
                  {sortedSections.map((section, sectionIndex) => {
                    const modules = (section.modules ?? [])
                      .slice()
                      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                    const lectures = (section.lectures ?? [])
                      .slice()
                      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                    return (
                      <details
                        className="group border-t border-[#343943] py-4"
                        key={section.id}
                        open={sectionIndex === 0}
                      >
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
                          <span>
                            <span className="block text-sm text-[#A3A5AE]">
                              ধাপ {bn(section.position + 1)}
                            </span>
                            <span className="block text-lg font-semibold">
                              {section.title}
                            </span>
                          </span>
                          <span
                            aria-hidden
                            className="text-2xl leading-[1.3] text-[#C9A15A]"
                          >
                            <span className="group-open:hidden">+</span>
                            <span className="hidden group-open:inline">–</span>
                          </span>
                        </summary>

                        <ul className="mt-3 space-y-0.5">
                          {modules.map((module) => {
                            const contentTypes = Array.isArray(
                              module.contentTypes
                            )
                              ? module.contentTypes
                              : []
                            const ContentIcon = contentTypes.includes("video")
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
                                    ? "ভিডিও"
                                    : `${bn(module.videoCount)}টি ভিডিও`
                                  : type === "pdf"
                                    ? "PDF"
                                    : type === "quiz"
                                      ? "কুইজ"
                                      : "অ্যাসাইনমেন্ট"
                              )
                              .join(" + ")
                            const open =
                              isEnrolled || contentTypes.includes("video")
                            return (
                              <li
                                className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-[0.95rem] text-[#A3A5AE]"
                                key={module.id}
                              >
                                <span className="flex min-w-0 items-center gap-2.5">
                                  {open ? (
                                    <ContentIcon
                                      aria-hidden
                                      className="size-4 shrink-0 text-[#C9A15A]"
                                    />
                                  ) : (
                                    <Lock
                                      aria-hidden
                                      className="size-4 shrink-0 text-[#5b5e66]"
                                    />
                                  )}
                                  <span className="truncate">
                                    {module.title}
                                  </span>
                                </span>
                                <span className="flex shrink-0 items-center gap-3 text-sm">
                                  {module.durationSeconds ? (
                                    <span>
                                      {bn(
                                        Math.round(module.durationSeconds / 60)
                                      )}{" "}
                                      মি
                                    </span>
                                  ) : null}
                                  <span className="hidden text-[#C9A15A] sm:inline">
                                    {contentLabel}
                                  </span>
                                </span>
                              </li>
                            )
                          })}
                        </ul>

                        {/* Lectures come per milestone in the public payload,
                            so they are listed separately in position order. */}
                        {lectures.length > 0 ? (
                          <ul className="mt-2 space-y-0.5 border-t border-[#343943] pt-2">
                            {lectures.map((lecture) => (
                              <li
                                className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-[0.95rem] text-[#A3A5AE]"
                                key={lecture.id}
                              >
                                <span className="flex min-w-0 items-center gap-2.5">
                                  {lecture.isPreview ? (
                                    <PlayCircle
                                      aria-hidden
                                      className="size-4 shrink-0 text-[#C9A15A]"
                                    />
                                  ) : (
                                    <Lock
                                      aria-hidden
                                      className="size-4 shrink-0 text-[#5b5e66]"
                                    />
                                  )}
                                  <span className="truncate">
                                    {lecture.title}
                                  </span>
                                </span>
                                <span className="flex shrink-0 items-center gap-3 text-sm">
                                  {lecture.durationSeconds ? (
                                    <span>
                                      {bn(
                                        Math.round(lecture.durationSeconds / 60)
                                      )}{" "}
                                      মি
                                    </span>
                                  ) : null}
                                  {lecture.isPreview ? (
                                    <span className="text-[#7FB8A8]">
                                      ফ্রি প্রিভিউ
                                    </span>
                                  ) : null}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </details>
                    )
                  })}
                </div>
              </section>
            ) : null}

            {course.instructorName ? (
              <section className="mt-14 scroll-mt-8" id="instructor">
                <h2 className={h2}>মেন্টর</h2>
                {/* The public API returns only the name: no bio or photo is
                    shown or invented. */}
                <p className="mt-4 rounded-xl border border-[#343943] bg-[#1B1F29] px-5 py-4 text-lg">
                  {course.instructorName}
                </p>
              </section>
            ) : null}

            <section className="mt-14 scroll-mt-8" id="reviews">
              <h2 className={h2}>রিভিউ</h2>
              <div className="mt-5">
                <CourseReviewsSection
                  courseId={course.id}
                  fallbackAverage={course.averageRating ?? null}
                  fallbackCount={course.reviewCount ?? 0}
                  slug={course.slug}
                />
              </div>
            </section>
          </div>

          <aside className="h-fit scroll-mt-8 lg:sticky lg:top-8" id="enroll">
            <div className="space-y-4 rounded-xl border border-[#343943] bg-[#1B1F29] p-6">
              <div>
                <p className="text-sm text-[#A3A5AE]">কোর্স ফি</p>
                <p className="mt-1 text-4xl font-semibold text-[#C9A15A] tabular-nums">
                  {formatPrice(course.currency, course.price)}
                </p>
              </div>

              {/* Shown only when the API returns a real enrollmentEndsAt. */}
              {course.enrollmentEndsAt ? (
                <p className="border-t border-[#343943] pt-4 text-sm text-[#A3A5AE]">
                  {new Date(course.enrollmentEndsAt) > new Date()
                    ? `ভর্তি চলবে ${formatEnrollmentDate(course.enrollmentEndsAt)} পর্যন্ত`
                    : `ভর্তি শেষ হয়েছে ${formatEnrollmentDate(course.enrollmentEndsAt)}`}
                </p>
              ) : null}

              {error ? (
                <p
                  className="rounded-lg border border-[#B5483F]/50 bg-[#B5483F]/10 px-3 py-2.5 text-sm text-[#E58A81]"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              {isEnrolled ? (
                <div className="space-y-3">
                  <p className="text-sm text-[#A3A5AE]">
                    আপনি এই কোর্সে এনরোল করা আছেন। যেখানে থেমেছিলেন, সেখান থেকে
                    শুরু করুন।
                  </p>
                  <Link className={btnBrass} href={`/learn/${course.id}`}>
                    পড়া চালিয়ে যান
                  </Link>
                  <Link
                    className={btnLine}
                    href={`/dashboard/student/messages/new?courseId=${course.id}&title=${encodeURIComponent(course.title)}`}
                  >
                    <MessageCircle aria-hidden className="size-4" />
                    শিক্ষককে মেসেজ করুন
                  </Link>
                </div>
              ) : pendingOrder ? (
                <div className="space-y-3">
                  <p className="flex items-start gap-2 text-sm text-[#A3A5AE]">
                    <Clock3
                      aria-hidden
                      className="mt-1.5 size-4 shrink-0 text-[#C9A15A]"
                    />
                    পেমেন্ট যাচাই চলছে। PayConfirm আপনার ট্রানজ্যাকশন যাচাই
                    করলেই এনরোলমেন্ট চালু হবে।
                  </p>
                  <Link
                    className={btnLine}
                    href={`/checkout/bkash?order_id=${pendingOrder.id}`}
                  >
                    পেমেন্টের অবস্থা দেখুন
                  </Link>
                </div>
              ) : rejectedOrder ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-[#B5483F]/50 bg-[#B5483F]/10 px-3 py-2.5 text-sm text-[#E58A81]">
                    <p>আপনার পেমেন্ট প্রমাণ গ্রহণ করা হয়নি।</p>
                    {rejectedOrder.rejectionReason ? (
                      <p className="mt-1">{rejectedOrder.rejectionReason}</p>
                    ) : null}
                  </div>
                  <Link
                    className={btnBrass}
                    href={`/checkout/bkash?order_id=${rejectedOrder.id}`}
                  >
                    আবার পেমেন্ট প্রমাণ জমা দিন
                  </Link>
                </div>
              ) : !canEnroll ? (
                <p className="rounded-lg border border-[#343943] px-3 py-2.5 text-sm text-[#A3A5AE]">
                  এই কোর্সে এখন ভর্তি নেওয়া হচ্ছে না।
                </p>
              ) : isAuthenticated ? (
                <div className="space-y-3">
                  <Link
                    className={btnBrass}
                    href={`/courses/${course.slug}/checkout`}
                  >
                    এনরোল করুন
                  </Link>
                  <p className="text-sm text-[#A3A5AE]">
                    পেমেন্ট স্বয়ংক্রিয়ভাবে যাচাই হয়। PayConfirm ট্রানজ্যাকশন
                    অনুমোদন করলে এনরোলমেন্ট চালু হবে।
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[#A3A5AE]">
                    এনরোল করতে সাইন ইন করুন। পেমেন্ট PayConfirm দিয়ে
                    স্বয়ংক্রিয়ভাবে যাচাই হয়।
                  </p>
                  <Link
                    className={btnBrass}
                    href={`/auth/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`}
                  >
                    সাইন ইন করে এনরোল করুন
                  </Link>
                </div>
              )}

              <Link
                className="block border-t border-[#343943] pt-4 text-sm text-[#C9A15A] hover:underline"
                href="/bundles"
              >
                একাধিক কোর্স একসাথে চাইলে বান্ডেল দেখুন
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </PublicShell>
  )
}
