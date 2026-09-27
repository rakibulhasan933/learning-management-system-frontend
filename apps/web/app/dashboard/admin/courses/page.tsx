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
import type { AdminCourseApprovalQueueResponse } from "@workspace/types"
import type { AdminCategoryListResponse } from "@workspace/types"

import {
  approveCourseAction,
  rejectCourseAction,
  assignCourseCategoryAction,
} from "@/app/dashboard/admin/actions"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@workspace/ui/components/button"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { PageHeader } from "@workspace/ui/components/page-header"
import { StatTile } from "@workspace/ui/components/stat-tile"
import { SubmitButton } from "@/components/submit-button"
import { CourseStatusPill } from "@/components/status-pill"
import { formatDateTime, formatPrice } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function AdminCoursesPage() {
  const [response, categoryResponse] = await Promise.all([
    authenticatedApiFetch<AdminCourseApprovalQueueResponse>("/admin/courses/pending", { cache: "no-store" }),
    authenticatedApiFetch<AdminCategoryListResponse>("/admin/categories", { cache: "no-store" }),
  ])

  const total = response.courses.length

  return (
    <>
      <PageHeader
        action={
          <Button  variant="outline" asChild>
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
          hint={total === 1 ? "course waiting on review" : "courses waiting on review"}
          icon={<Clock />}
          label="In the queue"
          tone={total > 0 ? "primary" : "default"}
          value={total}
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
                  <form action={approveCourseAction}>
                    <input name="courseId" type="hidden" value={course.id} />
                    <SubmitButton className="w-full" pendingLabel="Approving...">
                      <CheckCircle2 className="size-3.5" />
                      Approve
                    </SubmitButton>
                  </form>
                  <form action={assignCourseCategoryAction} className="flex gap-2">
                    <input name="courseId" type="hidden" value={course.id} />
                    <select className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-input/30 px-2 text-xs" defaultValue={course.category ?? ""} name="category">
                      <option value="">No category</option>
                      {categoryResponse.categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                    </select>
                    <SubmitButton pendingLabel="..." variant="outline">Save</SubmitButton>
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
