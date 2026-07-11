import Link from "next/link"
import type { InstructorCourseListResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

export default async function InstructorCoursesPage() {
  const data = await authenticatedApiFetch<InstructorCourseListResponse>(
    "/instructor/courses",
    { cache: "no-store" },
  )

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-muted-foreground">
              Instructor courses
            </p>
            <h1 className="mt-3 text-4xl tracking-tight">Manage your courses</h1>
          </div>
          <Link
            className="bg-primary px-4 py-2 text-sm text-primary-foreground"
            href="/dashboard/instructor/courses/new"
          >
            Create course
          </Link>
        </div>

        <div className="mt-8 grid gap-4">
          {data.courses.map((course) => (
            <Link
              className="grid gap-4 border border-border bg-card p-5 md:grid-cols-[1fr_auto] md:items-center"
              href={`/dashboard/instructor/courses/${course.id}/edit`}
              key={course.id}
            >
              <div>
                <p className="font-mono text-xs text-muted-foreground">
                  {course.status.replace("_", " ")} · {course.slug}
                </p>
                <h2 className="mt-2 text-2xl">{course.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {course.shortDescription}
                </p>
              </div>
              <p className="font-mono text-sm">
                {Number(course.price) === 0
                  ? "Free"
                  : `${course.currency} ${course.price}`}
              </p>
            </Link>
          ))}
        </div>

        {data.courses.length === 0 ? (
          <p className="mt-8 border border-border bg-card p-5 text-muted-foreground">
            No courses yet. Create your first draft to start building.
          </p>
        ) : null}
      </section>
    </main>
  )
}
