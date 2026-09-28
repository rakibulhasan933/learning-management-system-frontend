import Link from "next/link"
import { ArrowRight, BookOpen, Plus } from "lucide-react"
import type { InstructorCourseListResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@workspace/ui/components/button"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { PageHeader } from "@workspace/ui/components/page-header"
import { CourseStatusPill } from "@/components/status-pill"
import { formatPrice } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function InstructorCoursesPage() {
  const data = await authenticatedApiFetch<InstructorCourseListResponse>(
    "/instructor/courses",
    { cache: "no-store" }
  )

  return (
    <>
      <PageHeader
        action={
          <Button asChild>
            <Link href="/dashboard/instructor/courses/new">
              <Plus className="size-3.5" />
              Create course
            </Link>
          </Button>
        }
        eyebrow="Instructor courses"
        lede={`${data.courses.length} ${
          data.courses.length === 1 ? "course" : "courses"
        } in your catalog. Open one to edit its outline, lectures, and pricing.`}
        title="Manage your courses"
      />

      {data.courses.length === 0 ? (
        <EmptyState
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard/instructor/courses/new">
                <Plus className="size-3.5" />
                Create course
              </Link>
            </Button>
          }
          className="mt-12"
          description="Create your first draft to start building."
          icon={<BookOpen />}
          title="No courses yet"
        />
      ) : (
        <div className="mt-12 grid gap-4">
          {data.courses.map((course) => (
            <Link
              className="group interactive-card rounded-2xl bg-card p-6 text-sm text-card-foreground ring-1 ring-foreground/10"
              href={`/dashboard/instructor/courses/${course.id}`}
              key={course.id}
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CourseStatusPill status={course.status} />
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {course.slug}
                    </span>
                  </div>
                  <h2 className="mt-3 font-heading text-2xl tracking-tight">
                    {course.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {course.shortDescription}
                  </p>
                </div>
                <div className="flex items-center gap-3 md:flex-col md:items-end">
                  <p className="font-mono text-base text-primary tabular-nums">
                    {formatPrice(course.price, course.currency)}
                  </p>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
