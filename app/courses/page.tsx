import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarDays, ImageIcon, Sparkles } from "lucide-react"
import type { CourseLevel, CourseListResponse } from "@/lib/types"

import { publicApiFetch } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { ProgressThread } from "@/components/ui/progress-thread"
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

function buildQuery(params: Awaited<CoursesPageProps["searchParams"]>) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value)
    }
  }

  return query.toString()
}

function formatPrice(currency: string, price: string) {
  return Number(price) === 0 ? "Free" : `${currency} ${price}`
}

function enrollmentIsOpen(course: CourseListResponse["courses"][number]) {
  return (
    course.enrollmentEnabled !== false &&
    (!course.enrollmentEndsAt || new Date(course.enrollmentEndsAt) > new Date())
  )
}

function formatEnrollmentDate(value: string | null) {
  if (!value) return "No closing date"
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams
  const query = buildQuery(params)
  const data = await publicApiFetch<CourseListResponse>(
    `/courses${query ? `?${query}` : ""}`,
    { cache: "no-store" }
  )

  return (
    <PublicShell>
      <main className="courses-page px-4 py-8 sm:px-6 sm:py-12">
        <section className="mx-auto max-w-6xl">
          <div className="course-page-kicker mb-8"><ProgressThread /></div>
          <div className="courses-hero grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="eyebrow">বাংলাদেশের স্কিল-ফার্স্ট লার্নিং প্ল্যাটফর্ম</p>
              <h1 className="mt-3 font-heading text-4xl leading-[1.05] tracking-tight sm:text-5xl">
                শিখুন আজ, এগিয়ে থাকুন আগামীকাল
              </h1>
              <div className="mt-4 flex items-center gap-2 text-sm text-primary"><span className="size-2 rounded-full bg-primary shadow-[0_0_0_5px_color-mix(in_srgb,var(--primary)_12%,transparent)]" /> নতুন ব্যাচে ভর্তি চলছে</div>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                বাংলায় সাজানো, মেন্টর-গাইডেড কোর্সে নিজের ক্যারিয়ারকে পরের স্তরে নিয়ে যান।
                {" "}{data.pagination.total}টি যাচাই করা কোর্স আপনার অপেক্ষায়।
              </p>
              <div className="mt-7 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="course-trust-pill">ক্যারিয়ার-রেডি স্কিল</span>
                <span className="course-trust-pill">বাংলাদেশি মেন্টর</span>
                <span className="course-trust-pill">সার্টিফিকেটসহ</span>
              </div>
            </div>
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

          <div className="course-results-bar mt-12 flex items-center justify-between gap-4 border-y border-border py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              <span>
                {data.pagination.total}টির মধ্যে {data.courses.length}টি কোর্স দেখানো হচ্ছে
              </span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              পৃষ্ঠা {data.pagination.page} / {Math.max(data.pagination.totalPages, 1)}
            </span>
          </div>

          <div className="course-grid mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.courses.map((course) => (
              <Link
                className="course-card group interactive-card flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-colors hover:ring-primary/50"
                href={`/courses/${course.slug}`}
                key={course.id}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-background">
                  {course.thumbnailUrl ? (
                    <Image
                      alt={course.title}
                      className="object-cover"
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      src={course.thumbnailUrl}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-8" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 rounded-full bg-background/90 px-3 py-1 font-mono text-xs text-primary backdrop-blur-sm">
                    {formatPrice(course.currency, course.price)}
                  </div>
                  <ProgressThread className="absolute inset-x-0 bottom-0 w-0 transition-[width] duration-500 group-hover:w-full" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className="font-mono text-[11px] text-muted-foreground"
                      variant="outline"
                    >
                      {(course.category ?? "General").replaceAll("-", " ")}
                    </Badge>
                    <Badge
                      className="border-primary/40 bg-primary/10 font-mono text-[11px] text-primary capitalize"
                      variant="outline"
                    >
                      {course.level.replace("_", " ")}
                    </Badge>
                  </div>
                  <h2 className="mt-4 font-heading text-2xl leading-tight tracking-tight">
                    {course.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {course.shortDescription ?? "A focused learning path designed to help you build practical skills."}
                  </p>
                  <div className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span>
                      {enrollmentIsOpen(course)
                        ? course.enrollmentEndsAt
                          ? `Enrollment ends ${formatEnrollmentDate(course.enrollmentEndsAt)}`
                          : "Enrollment open · no closing date"
                        : "Enrollment closed"}
                    </span>
                  </div>
                  <div className="mt-auto pt-6">
                    <div className="h-px w-full bg-border" />
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-muted-foreground">
                        {course.instructorName ?? "Instructor"}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-sm text-primary">
                        View course <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {data.courses.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-dashed border-border p-10 text-center">
              <ImageIcon className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No published courses match your filters.
              </p>
            </div>
          ) : null}

          {data.pagination.totalPages > 1 ? (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: data.pagination.totalPages }, (_, index) => {
                const page = index + 1
                const query = new URLSearchParams(buildQuery(params))
                query.set("page", String(page))
                return (
                  <Link
                    className={`flex size-9 items-center justify-center rounded-full border text-sm ${
                      page === data.pagination.page
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                    href={`/courses?${query.toString()}`}
                    key={page}
                  >
                    {page}
                  </Link>
                )
              })}
            </div>
          ) : null}
        </section>
      </main>
    </PublicShell>
  )
}
