import Link from "next/link"
import type { AdminCourseApprovalQueueResponse } from "@workspace/types"

import {
  approveCourseAction,
  rejectCourseAction,
} from "@/app/dashboard/admin/actions"
import { authenticatedApiFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

export default async function AdminCoursesPage() {
  const response =
    await authenticatedApiFetch<AdminCourseApprovalQueueResponse>(
      "/admin/courses/pending",
      { cache: "no-store" },
    )

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Admin dashboard
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl tracking-tight">Course approval</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review courses submitted by instructors before they appear in the
              public catalog.
            </p>
          </div>
          <Link
            className="border border-border px-4 py-2 text-sm text-foreground"
            href="/dashboard/admin"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-8 space-y-4">
          {response.courses.length === 0 ? (
            <div className="border border-border bg-card p-5 text-sm text-muted-foreground">
              No courses are waiting for approval.
            </div>
          ) : (
            response.courses.map((course) => (
              <article className="border border-border bg-card p-5" key={course.id}>
                <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl">{course.title}</h2>
                      <span className="border border-primary px-2 py-1 font-mono text-xs text-primary">
                        {course.status.replace("_", " ")}
                      </span>
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Instructor</dt>
                        <dd className="font-mono">{course.instructorEmail}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Slug</dt>
                        <dd className="font-mono">{course.slug}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Price</dt>
                        <dd className="font-mono">
                          {course.currency} {course.price}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Submitted</dt>
                        <dd>{new Date(course.submittedAt).toLocaleString()}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="space-y-3">
                    <form action={approveCourseAction}>
                      <input name="courseId" type="hidden" value={course.id} />
                      <button
                        className="w-full bg-primary px-4 py-2 text-sm text-primary-foreground"
                        type="submit"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={rejectCourseAction}>
                      <input name="courseId" type="hidden" value={course.id} />
                      <button
                        className="w-full border border-destructive/50 px-4 py-2 text-sm text-destructive"
                        type="submit"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
