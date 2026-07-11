import Link from "next/link"
import type { CourseLevel, CourseListResponse } from "@workspace/types"

import { publicApiFetch } from "@/lib/api-client"

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

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams
  const query = buildQuery(params)
  const data = await publicApiFetch<CourseListResponse>(
    `/courses${query ? `?${query}` : ""}`,
    { cache: "no-store" },
  )

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="font-mono text-sm text-muted-foreground">
              Course catalog
            </p>
            <h1 className="mt-3 text-5xl tracking-tight">Find your next course</h1>
          </div>
          <form className="grid gap-3 border border-border bg-card p-4">
            <input
              className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              name="q"
              placeholder="Search courses"
              defaultValue={params.q}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                name="level"
                defaultValue={params.level ?? ""}
              >
                <option value="">Any level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="all_levels">All levels</option>
              </select>
              <input
                className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                name="category"
                placeholder="Category"
                defaultValue={params.category}
              />
            </div>
            <button className="bg-primary px-4 py-2 text-sm text-primary-foreground">
              Apply filters
            </button>
          </form>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.courses.map((course) => (
            <Link
              className="border border-border bg-card p-5 transition-colors hover:border-primary"
              href={`/courses/${course.slug}`}
              key={course.id}
            >
              <p className="font-mono text-xs text-muted-foreground">
                {course.category ?? "General"} · {course.level.replace("_", " ")}
              </p>
              <h2 className="mt-4 text-2xl">{course.title}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                {course.shortDescription}
              </p>
              <div className="mt-6 h-px w-full bg-primary" />
              <div className="mt-4 flex items-center justify-between text-sm">
                <span>{course.instructorName ?? "Instructor"}</span>
                <span className="font-mono">
                  {Number(course.price) === 0
                    ? "Free"
                    : `${course.currency} ${course.price}`}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {data.courses.length === 0 ? (
          <p className="mt-10 border border-border bg-card p-5 text-muted-foreground">
            No published courses match your filters.
          </p>
        ) : null}
      </section>
    </main>
  )
}
