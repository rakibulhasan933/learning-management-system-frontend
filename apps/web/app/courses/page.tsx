import Image from "next/image"
import Link from "next/link"
import { ImageIcon } from "lucide-react"
import type { CourseLevel, CourseListResponse } from "@workspace/types"

import { publicApiFetch } from "@/lib/api-client"
import { Badge } from "@workspace/ui/components/badge"
import { ProgressThread } from "@workspace/ui/components/progress-thread"
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

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams
  const query = buildQuery(params)
  const data = await publicApiFetch<CourseListResponse>(
    `/courses${query ? `?${query}` : ""}`,
    { cache: "no-store" }
  )

  return (
    <PublicShell>
      <main className="px-4 py-8 sm:px-6 sm:py-12">
        <section className="mx-auto max-w-6xl">
          <ProgressThread className="mb-8" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="font-mono text-xs tracking-wide text-muted-foreground">
                Course catalog
              </p>
              <h1 className="mt-3 font-heading text-4xl leading-[1.05] tracking-tight sm:text-5xl">
                Find your next course
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                {data.pagination.total} published{" "}
                {data.pagination.total === 1 ? "course" : "courses"}, each with
                a full outline and verified enrollment.
              </p>
            </div>
            <CourseFilterForm
              defaults={{
                category: params.category,
                level: params.level,
                q: params.q,
              }}
            />
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.courses.map((course) => (
              <Link
                className="group interactive-card flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10"
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
                  <ProgressThread className="absolute inset-x-0 bottom-0 w-0 transition-[width] duration-500 group-hover:w-full" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className="font-mono text-[11px] text-muted-foreground"
                      variant="outline"
                    >
                      {course.category ?? "General"}
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
                    {course.shortDescription}
                  </p>
                  <div className="mt-auto pt-6">
                    <div className="h-px w-full bg-border" />
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-muted-foreground">
                        {course.instructorName ?? "Instructor"}
                      </span>
                      <span className="shrink-0 font-mono text-base text-primary tabular-nums">
                        {formatPrice(course.currency, course.price)}
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
        </section>
      </main>
    </PublicShell>
  )
}
