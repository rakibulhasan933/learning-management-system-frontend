import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  Mail,
  Tag,
  XCircle,
} from "lucide-react"
import type { AdminCourseApprovalQueueResponse } from "@/lib/types"
import type { AdminCategoryListResponse } from "@/lib/types"

import {
  approveCourseAction,
  rejectCourseAction,
  assignCourseCategoryAction,
  updateCourseEnrollmentSettingsAction,
} from "@/app/dashboard/admin/actions"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { StatTile } from "@/components/ui/stat-tile"
import { SubmitButton } from "@/components/submit-button"
import { CourseStatusPill } from "@/components/status-pill"
import { formatDateTime, formatPrice } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function AdminCoursesPage() {
  const [response, categoryResponse] = await Promise.all([
    authenticatedApiFetch<AdminCourseApprovalQueueResponse>(
      "/admin/courses/pending",
      { cache: "no-store" }
    ),
    authenticatedApiFetch<AdminCategoryListResponse>("/admin/categories", {
      cache: "no-store",
    }),
  ])

  // The queue endpoint returns every listed course (including Published
  // ones); the header must count only courses actually pending review.
  const pendingTotal = response.courses.filter(
    (course) => course.status === "pending_review"
  ).length

  return (
    <>
      <PageHeader
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin">
              <ArrowLeft className="size-3.5" />
              Dashboard
            </Link>
          </Button>
        }
        eyebrow="Admin dashboard · Approval queue"
        lede="Review what instructors have submitted before it reaches the public catalog. Approve to publish, reject to send it back."
        title="Course approval"
      />

      <div className="mt-12 grid gap-4 sm:max-w-xs">
        <StatTile
          hint={
            pendingTotal === 1
              ? "course pending review"
              : "courses pending review"
          }
          icon={<Clock />}
          label="Pending review"
          tone={pendingTotal > 0 ? "primary" : "default"}
          value={pendingTotal}
        />
      </div>

      <div className="mt-5 space-y-3">
        {response.courses.length === 0 ? (
          <EmptyState
            description="No courses are waiting for approval right now."
            icon={<CheckCircle2 />}
            title="Queue is clear"
          />
        ) : (
          response.courses.map((course, index) => (
            <article
              className="group relative rounded-2xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow duration-300 hover:ring-primary/40 sm:p-6"
              key={course.id}
            >
              <div className="grid gap-6 lg:grid-cols-[auto_1fr_200px]">
                <span className="hidden font-mono text-xs text-muted-foreground tabular-nums lg:block">
                  {index + 1}
                </span>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-heading text-xl tracking-tight sm:text-2xl">
                      {course.title}
                    </h2>
                    <CourseStatusPill status={course.status} />
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <Mail className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <div>
                        <dt className="text-xs tracking-wide text-muted-foreground">
                          Instructor
                        </dt>
                        <dd className="font-mono text-foreground">
                          {course.instructorEmail}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Tag className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <div>
                        <dt className="text-xs tracking-wide text-muted-foreground">
                          Slug
                        </dt>
                        <dd className="font-mono text-foreground">
                          {course.slug}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Tag className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <div>
                        <dt className="text-xs tracking-wide text-muted-foreground">
                          Category
                        </dt>
                        <dd className="font-mono text-foreground">
                          {categoryResponse.categories.find(
                            (category) => category.slug === course.category
                          )?.name ?? course.category ?? "No category"}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Coins className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <div>
                        <dt className="text-xs tracking-wide text-muted-foreground">
                          Price
                        </dt>
                        <dd className="font-mono text-foreground">
                          {formatPrice(course.price, course.currency)}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <div>
                        <dt className="text-xs tracking-wide text-muted-foreground">
                          Submitted
                        </dt>
                        <dd className="font-mono text-foreground">
                          {formatDateTime(course.submittedAt)}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-col gap-2 lg:justify-center">
                  <form action={updateCourseEnrollmentSettingsAction} className="grid gap-2 rounded-xl border border-border bg-background p-3">
                    <input name="courseId" type="hidden" value={course.id} />
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input defaultChecked={course.enrollmentEnabled !== false} name="enrollmentEnabled" type="checkbox" />
                      Enrollment open
                    </label>
                    <input
                      className="h-9 rounded-lg border border-input bg-input/30 px-2 text-xs"
                      defaultValue={course.enrollmentEndsAt?.slice(0, 16) ?? ""}
                      name="enrollmentEndsAt"
                      type="datetime-local"
                    />
                    <SubmitButton pendingLabel="Saving..." variant="outline">
                      Save enrollment settings
                    </SubmitButton>
                  </form>
                  {course.status === "pending_review" ? (
                    <form action={approveCourseAction}>
                      <input name="courseId" type="hidden" value={course.id} />
                      <SubmitButton className="w-full" pendingLabel="Approving...">
                        <CheckCircle2 className="size-3.5" />
                        Approve
                      </SubmitButton>
                    </form>
                  ) : null}
                  <form
                    action={assignCourseCategoryAction}
                    className="flex gap-2"
                  >
                    <input name="courseId" type="hidden" value={course.id} />
                    <select
                      className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-input/30 px-2 text-xs text-foreground [&>option]:bg-card [&>option]:text-foreground"
                      defaultValue={course.category ?? ""}
                      name="category"
                    >
                      <option className="bg-card text-foreground" value="">
                        No category
                      </option>
                      {categoryResponse.categories.map((category) => (
                        <option
                          className="bg-card text-foreground"
                          key={category.id}
                          value={category.slug}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <SubmitButton pendingLabel="..." variant="outline">
                      Save
                    </SubmitButton>
                  </form>
                  <form action={rejectCourseAction}>
                    <input name="courseId" type="hidden" value={course.id} />
                    <SubmitButton
                      className="w-full"
                      pendingLabel="Rejecting..."
                      variant="destructive"
                    >
                      <XCircle className="size-3.5" />
                      Reject
                    </SubmitButton>
                  </form>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  )
}
