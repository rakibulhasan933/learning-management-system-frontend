import { ProgressiveImage } from "@/components/progressive-image"
import Link from "next/link"
import { ArrowUpRight, ImageIcon } from "lucide-react"
import type { CourseLevel, CourseListResponse } from "@/lib/types"

import { publicApiFetch } from "@/lib/api-client"
import { PublicShell } from "@/components/public-shell"

import { CourseFilterForm } from "./course-filter-form"

export const dynamic = "force-dynamic"

interface CoursesPageProps {
  searchParams: Promise<{
    category?: string
    level?: CourseLevel
    maxPrice?: string
    page?: string
    q?: string
  }>
}

type Course = CourseListResponse["courses"][number]

const levelLabels: Record<string, string> = {
  beginner: "শুরুর স্তর",
  intermediate: "মাঝারি স্তর",
  advanced: "অ্যাডভান্সড",
  all_levels: "সব স্তর",
}

const thumbColors = ["bg-[#315B54]", "bg-[#3E596A]", "bg-[#6F5144]"]

const bn = (n: number) => n.toLocaleString("bn-BD")

function buildQuery(params: Awaited<CoursesPageProps["searchParams"]>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value)
  }
  return query.toString()
}

function formatPrice(price: string) {
  return Number(price) === 0 ? "ফ্রি" : `৳${bn(Number(price))}`
}

function enrollmentIsOpen(course: Course) {
  return (
    course.enrollmentEnabled !== false &&
    (!course.enrollmentEndsAt || new Date(course.enrollmentEndsAt) > new Date())
  )
}

function enrollmentText(course: Course) {
  if (!enrollmentIsOpen(course)) return "ভর্তি বন্ধ"
  if (!course.enrollmentEndsAt) return "ভর্তি চলছে"
  const date = new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium" }).format(
    new Date(course.enrollmentEndsAt)
  )
  return `ভর্তি চলছে · শেষ ${date}`
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams
  const query = buildQuery(params)
  const data = await publicApiFetch<CourseListResponse>(
    `/courses${query ? `?${query}` : ""}`,
    { cache: "no-store" }
  )

  const hasFilters = Boolean(
    params.q || params.level || params.category || params.maxPrice
  )
  const totalPages = Math.max(data.pagination.totalPages, 1)
  const pageHref = (page: number) => {
    const q = new URLSearchParams(buildQuery(params))
    q.set("page", String(page))
    return `/courses?${q.toString()}`
  }

  return (
    <PublicShell variant="home">
      <main className="bg-[#12151C] leading-[1.85] text-[#F2EFE7] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[#C9A15A]">
        <div className="mx-auto w-[min(1200px,calc(100%-2.5rem))] py-10 sm:py-16">
          <header className="max-w-3xl">
            <h1 className="text-[2.2rem] leading-[1.3] font-semibold text-balance sm:text-5xl">
              সব কোর্স, এক জায়গায়।
            </h1>
            <p className="mt-4 text-lg text-[#A3A5AE]">
              বাংলায় সাজানো {bn(data.pagination.total)}টি কোর্স। ক্যাটাগরি,
              স্তর বা বাজেট দিয়ে আপনারটা বেছে নিন।
            </p>
          </header>

          <div className="mt-8">
            <CourseFilterForm
              defaults={{
                category: params.category,
                level: params.level,
                maxPrice: params.maxPrice,
                q: params.q,
              }}
              categories={Array.from(
                new Set(
                  data.courses
                    .map((course) => course.category)
                    .filter((category): category is string => Boolean(category))
                )
              ).sort()}
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#343943] pb-4 text-sm text-[#A3A5AE]">
            <p>
              {bn(data.pagination.total)}টির মধ্যে {bn(data.courses.length)}টি
              কোর্স দেখানো হচ্ছে
            </p>
            <div className="flex items-center gap-4">
              {hasFilters ? (
                <Link
                  className="text-[#C9A15A] underline underline-offset-4"
                  href="/courses"
                >
                  ফিল্টার মুছুন
                </Link>
              ) : null}
              <span>
                পৃষ্ঠা {bn(data.pagination.page)} / {bn(totalPages)}
              </span>
            </div>
          </div>

          {data.courses.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.courses.map((course, index) => (
                <Link
                  className="group flex flex-col overflow-hidden rounded-xl border border-[#343943] bg-[#1B1F29] transition-colors hover:border-[#C9A15A]"
                  href={`/courses/${course.slug}`}
                  key={course.id}
                >
                  <div
                    className={`relative aspect-video w-full overflow-hidden ${thumbColors[index % 3]}`}
                  >
                    {course.thumbnailUrl ? (
                      <ProgressiveImage
                        alt={course.title}
                        className="object-cover"
                        fill
                        priority={index === 0}
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        src={course.thumbnailUrl}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-white/70">
                        <ImageIcon aria-hidden className="size-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col p-5">
                    <p className="text-sm text-[#C9A15A]">
                      {(course.category ?? "সাধারণ").replaceAll("-", " ")} ·{" "}
                      {levelLabels[course.level] ??
                        course.level.replace("_", " ")}
                    </p>
                    <h2 className="mt-2 text-xl leading-[1.5] font-semibold text-balance">
                      {course.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-[0.95rem] text-[#A3A5AE]">
                      {course.shortDescription ??
                        "গোছানো ক্লাস ও হাতে-কলমে শেখার সুযোগ।"}
                    </p>
                    <p
                      className={`mt-4 mb-5 text-sm ${
                        enrollmentIsOpen(course)
                          ? "text-[#7FB8A8]"
                          : "text-[#A3A5AE]"
                      }`}
                    >
                      {enrollmentText(course)}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#343943] pt-4">
                      <div className="min-w-0">
                        <strong className="block text-xl">
                          {formatPrice(course.price)}
                        </strong>
                        <span className="block truncate text-sm text-[#A3A5AE]">
                          {course.instructorName ?? "ইনস্ট্রাক্টর"}
                        </span>
                      </div>
                      <ArrowUpRight
                        aria-hidden
                        className="size-5 flex-none text-[#C9A15A] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-xl border border-dashed border-[#343943] p-10 text-center">
              <ImageIcon
                aria-hidden
                className="mx-auto size-6 text-[#A3A5AE]"
              />
              <p className="mt-3 text-[#A3A5AE]">
                এই ফিল্টারে কোনো প্রকাশিত কোর্স নেই। ফিল্টার বদলে বা মুছে আবার
                দেখুন।
              </p>
              <Link
                className="mt-5 inline-flex min-h-12 items-center rounded-lg border border-[#C9A15A] bg-[#C9A15A] px-5 font-semibold text-[#12151C] transition-colors hover:bg-[#A88A4A]"
                href="/courses"
              >
                সব কোর্স দেখুন
              </Link>
            </div>
          )}

          {data.pagination.totalPages > 1 ? (
            <nav
              aria-label="পৃষ্ঠা"
              className="mt-10 flex flex-wrap justify-center gap-2"
            >
              {Array.from(
                { length: data.pagination.totalPages },
                (_, index) => {
                  const page = index + 1
                  const current = page === data.pagination.page
                  return (
                    <Link
                      aria-current={current ? "page" : undefined}
                      className={`flex size-11 items-center justify-center rounded-lg border text-sm transition-colors ${
                        current
                          ? "border-[#C9A15A] bg-[#C9A15A] font-semibold text-[#12151C]"
                          : "border-[#343943] text-[#A3A5AE] hover:border-[#C9A15A] hover:text-[#C9A15A]"
                      }`}
                      href={pageHref(page)}
                      key={page}
                    >
                      {bn(page)}
                    </Link>
                  )
                }
              )}
            </nav>
          ) : null}
        </div>
      </main>
    </PublicShell>
  )
}
