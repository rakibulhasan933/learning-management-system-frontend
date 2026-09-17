import Image from "next/image"
import Link from "next/link"
import type { CourseLevel, CourseListResponse } from "@workspace/types"

import { SiteHeader } from "@/components/site-header"
import { publicApiFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"
export const metadata = { title: "Explore courses" }

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
    if (value) query.set(key, value)
  }
  return query.toString()
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams
  const query = buildQuery(params)
  const data = await publicApiFetch<CourseListResponse>(
    `/courses${query ? `?${query}` : ""}`,
    { cache: "no-store" }
  ).catch(() => null)
  const hasFilters = Boolean(
    params.q || params.category || params.level || params.maxPrice
  )
  const fieldClass =
    "mt-2 w-full rounded-md border border-input bg-background px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"

  return (
    <>
      <SiteHeader />
      <main className="page-container min-h-[80vh] py-14 sm:py-20">
        <p className="eyebrow">A world of possibilities</p>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl tracking-[-.045em] sm:text-6xl">
              Find your next chapter.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
              Follow your curiosity, deepen your expertise, or try something
              entirely new. Your next step starts here.
            </p>
          </div>
          <Link href="/" className="nav-link">
            ← Back to home
          </Link>
        </div>
        <form
          className="mt-10 grid items-end gap-4 rounded-xl border border-border bg-[#171B23] p-5 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_.8fr_auto]"
          action="/courses"
        >
          <label className="text-xs text-muted-foreground">
            What would you like to learn?
            <input
              className={fieldClass}
              name="q"
              placeholder="Search courses…"
              defaultValue={params.q}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Experience level
            <select
              className={fieldClass}
              name="level"
              defaultValue={params.level ?? ""}
            >
              <option value="">Any level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="all_levels">All levels</option>
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Category
            <input
              className={fieldClass}
              name="category"
              placeholder="Any category"
              defaultValue={params.category}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Maximum price
            <input
              className={fieldClass}
              name="maxPrice"
              type="number"
              min="0"
              step="any"
              placeholder="Any price"
              defaultValue={params.maxPrice}
            />
          </label>
          <button className="button-primary !py-3" type="submit">
            Search <span aria-hidden="true">↗</span>
          </button>
        </form>
        <div className="mt-9 flex items-center justify-between border-b border-border pb-5">
          <h2 className="text-sm font-medium">
            {hasFilters ? "Search results" : "Explore the collection"}
            {data ? (
              <span className="ml-3 rounded bg-card px-2 py-1 font-mono text-xs text-muted-foreground">
                {data.pagination.total}
              </span>
            ) : null}
          </h2>
          {hasFilters ? (
            <Link
              className="text-xs text-primary hover:underline"
              href="/courses"
            >
              Clear filters
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">
              Learn something that stays with you.
            </span>
          )}
        </div>

        {data ? (
          data.courses.length > 0 ? (
            <>
              <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.courses.map((course) => (
                  <Link
                    className="topic-card group flex flex-col"
                    href={`/courses/${course.slug}`}
                    key={course.id}
                  >
                    <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden border-b border-border bg-[#252F2C]">
                      {course.thumbnailUrl ? (
                        <Image
                          alt={course.title}
                          src={course.thumbnailUrl}
                          fill
                          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <>
                          <span className="absolute h-28 w-28 rotate-45 rounded-2xl border border-primary/20" />
                          <span className="absolute h-20 w-20 rotate-45 rounded-xl border border-primary/30" />
                          <span className="display-heading text-5xl text-primary">
                            {course.title.charAt(0)}
                          </span>
                        </>
                      )}
                      <span className="absolute bottom-3 left-3 rounded bg-background px-2.5 py-1 text-[10px] text-foreground">
                        {course.category ?? "General"}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="font-mono text-[10px] text-primary">
                        {course.level.replaceAll("_", " ")}
                      </p>
                      <h2 className="mt-3 text-xl leading-snug">
                        {course.title}
                      </h2>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {course.shortDescription}
                      </p>
                      <div className="mt-auto pt-6">
                        <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-xs">
                          <span className="text-muted-foreground">
                            {course.instructorName ?? "Instructor"}
                          </span>
                          <span className="font-mono text-primary">
                            {Number(course.price) === 0
                              ? "Free"
                              : `${course.currency} ${Number(course.price).toLocaleString("en-US")}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {data.pagination.totalPages > 1 ? (
                <nav
                  aria-label="Course pagination"
                  className="mt-10 flex items-center justify-center gap-6"
                >
                  {data.pagination.page > 1 ? (
                    <Link
                      className="button-secondary"
                      href={`/courses?${buildQuery({ ...params, page: String(data.pagination.page - 1) })}`}
                    >
                      ← Previous
                    </Link>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  {data.pagination.page < data.pagination.totalPages ? (
                    <Link
                      className="button-secondary"
                      href={`/courses?${buildQuery({ ...params, page: String(data.pagination.page + 1) })}`}
                    >
                      Next →
                    </Link>
                  ) : null}
                </nav>
              ) : null}
            </>
          ) : (
            <div className="mt-7 rounded-xl border border-dashed border-border p-12 text-center">
              <p className="display-heading text-3xl">
                A little more exploring.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {hasFilters
                  ? "No courses match your filters. Try a different topic or broaden your search."
                  : "New learning opportunities are on the way. Check back soon for published courses."}
              </p>
              {hasFilters ? (
                <Link className="button-secondary mt-6" href="/courses">
                  Browse all courses
                </Link>
              ) : null}
            </div>
          )
        ) : (
          <div
            role="status"
            className="mt-7 rounded-xl border border-border bg-card px-6 py-12 text-center"
          >
            <p className="display-heading text-3xl">
              The catalog is taking a moment.
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
              We couldn’t connect to the course catalog. Please try again in a
              little while.
            </p>
            <form action="/courses" className="mt-6">
              {Object.entries(params).map(([name, value]) =>
                value ? (
                  <input key={name} type="hidden" name={name} value={value} />
                ) : null
              )}
              <button className="button-secondary" type="submit">
                Try again <span aria-hidden="true">↻</span>
              </button>
            </form>
          </div>
        )}
      </main>
    </>
  )
}
