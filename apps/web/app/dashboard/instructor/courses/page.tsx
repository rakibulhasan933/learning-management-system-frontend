import Link from "next/link"
import { ArrowRight, Plus } from "lucide-react"
import type { InstructorCourseListResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

const statusStyles: Record<string, string> = {
  draft: "border-muted-foreground/40 text-muted-foreground",
  published: "border-secondary text-secondary",
  archived: "border-destructive/60 text-destructive",
}

function statusStyle(status: string) {
  return statusStyles[status] ?? "border-primary text-primary"
}

export default async function InstructorCoursesPage() {
  const data = await authenticatedApiFetch<InstructorCourseListResponse>(
    "/instructor/courses",
    { cache: "no-store" },
  )

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-muted-foreground">
              Instructor courses
            </p>
            <h1 className="mt-3 font-heading text-3xl tracking-tight sm:text-4xl">
              Manage your courses
            </h1>
          </div>
          <Link
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
            href="/dashboard/instructor/courses/new"
          >
            <Plus className="h-3.5 w-3.5" />
            Create course
          </Link>
        </div>

        {data.courses.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No courses yet. Create your first draft to start building.
            </p>
            <Link
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
              href="/dashboard/instructor/courses/new"
            >
              <Plus className="h-3.5 w-3.5" />
              Create course
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {data.courses.map((course) => (
              <Link
                className="group grid gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40 md:grid-cols-[1fr_auto] md:items-center"
                href={`/dashboard/instructor/courses/${course.id}/edit`}
                key={course.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 font-mono text-[11px] capitalize ${statusStyle(course.status)}`}
                    >
                      {course.status.replace("_", " ")}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {course.slug}
                    </span>
                  </div>
                  <h2 className="mt-2 font-heading text-2xl">{course.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {course.shortDescription}
                  </p>
                </div>
                <div className="flex items-center gap-3 md:flex-col md:items-end">
                  <p className="font-mono text-sm tabular-nums">
                    {Number(course.price) === 0
                      ? "Free"
                      : `${course.currency} ${course.price}`}
                  </p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}