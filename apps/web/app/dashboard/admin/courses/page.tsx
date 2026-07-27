import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  Mail,
  Tag,
  XCircle,
} from "lucide-react"
import type { AdminCourseApprovalQueueResponse } from "@workspace/types"

import {
  approveCourseAction,
  rejectCourseAction,
} from "@/app/dashboard/admin/actions"
import { authenticatedApiFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

function formatSubmitted(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatPrice(currency: string, price: string | number) {
  let numeric = typeof price === "number" ? price : parseFloat(price as string)
  if (Number.isNaN(numeric)) numeric = 0

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(numeric)
  } catch {
    return `${currency} ${numeric}`
  }
}

export default async function AdminCoursesPage() {
  const response =
    await authenticatedApiFetch<AdminCourseApprovalQueueResponse>(
      "/admin/courses/pending",
      { cache: "no-store" },
    )

  const total = response.courses.length

  return (
    <main className="min-h-screen bg-[#0B0D0F] px-4 py-10 text-[#EDEEF0] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-6xl">
        {/* Masthead */}
        <div className="flex flex-col gap-6 border-b border-[#22262B] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#C9A24B]">
              Admin dashboard · Approval queue
            </p>
            <h1 className="mt-3 text-3xl font-medium tracking-tight text-[#EDEEF0] sm:text-4xl">
              Course approval
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#8B929B]">
              Review what instructors have submitted before it reaches the
              public catalog. Approve to publish, reject to send it back.
            </p>
          </div>
          <Link
            className="inline-flex w-fit items-center gap-2 border border-[#22262B] px-4 py-2 text-sm text-[#EDEEF0] transition-colors hover:border-[#C9A24B]/60 hover:text-[#C9A24B]"
            href="/dashboard/admin"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>

        {/* Queue stat */}
        <div className="mt-6 flex items-center gap-3 border border-[#22262B] bg-[#0E1013] px-5 py-4">
          <Clock className="h-4 w-4 text-[#C9A24B]" />
          <p className="text-sm text-[#8B929B]">
            <span className="font-mono text-lg text-[#EDEEF0]">
              {String(total).padStart(2, "0")}
            </span>{" "}
            {total === 1 ? "course" : "courses"} waiting on review
          </p>
        </div>

        {/* Queue */}
        <div className="mt-6 divide-y divide-[#22262B] border border-[#22262B] bg-[#131619]">
          {response.courses.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
              <CheckCircle2 className="h-5 w-5 text-[#8B929B]" />
              <p className="text-sm text-[#EDEEF0]">Queue is clear.</p>
              <p className="text-xs text-[#8B929B]">
                No courses are waiting for approval right now.
              </p>
            </div>
          ) : (
            response.courses.map((course, index) => (
              <article
                className="group relative border-l-2 border-transparent px-5 py-6 transition-colors hover:border-[#C9A24B] hover:bg-[#0E1013] sm:px-6"
                key={course.id}
              >
                <div className="grid gap-6 lg:grid-cols-[auto_1fr_200px]">
                  <span className="hidden font-mono text-xs text-[#8B929B] lg:block">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl text-[#EDEEF0] sm:text-2xl">
                        {course.title}
                      </h2>
                      <span className="inline-flex items-center gap-1.5 border border-[#C9A24B]/60 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-[#C9A24B]">
                        <Layers className="h-3 w-3" />
                        {course.status.replace("_", " ")}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="flex items-start gap-2">
                        <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8B929B]" />
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                            Instructor
                          </dt>
                          <dd className="font-mono text-[#EDEEF0]">
                            {course.instructorEmail}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8B929B]" />
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                            Slug
                          </dt>
                          <dd className="font-mono text-[#EDEEF0]">
                            {course.slug}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[10px] text-[#8B929B]">
                          $
                        </span>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                            Price
                          </dt>
                          <dd className="font-mono text-[#EDEEF0]">
                            {formatPrice(course.currency, course.price)}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8B929B]" />
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-[#8B929B]">
                            Submitted
                          </dt>
                          <dd className="font-mono text-[#EDEEF0]">
                            {formatSubmitted(course.submittedAt)}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </div>

                  <div className="flex flex-col gap-2 lg:justify-center">
                    <form action={approveCourseAction}>
                      <input name="courseId" type="hidden" value={course.id} />
                      <button
                        className="flex w-full items-center justify-center gap-2 bg-[#C9A24B] px-4 py-2 text-sm font-medium text-[#14110A] transition-opacity hover:opacity-90"
                        type="submit"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </button>
                    </form>
                    <form action={rejectCourseAction}>
                      <input name="courseId" type="hidden" value={course.id} />
                      <button
                        className="flex w-full items-center justify-center gap-2 border border-[#E5484D]/50 px-4 py-2 text-sm text-[#E5484D] transition-colors hover:bg-[#E5484D]/10"
                        type="submit"
                      >
                        <XCircle className="h-3.5 w-3.5" />
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