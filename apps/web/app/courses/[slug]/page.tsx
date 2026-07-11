import Link from "next/link"
import type { CourseDetailDto } from "@workspace/types"

import { createEnrollmentOrderAction } from "@/app/courses/[slug]/enroll/actions"
import { publicApiFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

interface CourseDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params
  const course = await publicApiFetch<CourseDetailDto>(`/courses/${slug}`, {
    cache: "no-store",
  })

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-8 h-px w-28 bg-primary" />
          <p className="font-mono text-sm text-muted-foreground">
            {course.category ?? "General"} · {course.level.replace("_", " ")}
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl tracking-tight">
            {course.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            {course.shortDescription}
          </p>
          <div className="mt-10 space-y-5">
            <h2 className="text-2xl">What you will learn</h2>
            <p className="whitespace-pre-line leading-7 text-muted-foreground">
              {course.description ?? "Course details will be added soon."}
            </p>
          </div>
          <div className="mt-10 space-y-4">
            <h2 className="text-2xl">Course outline</h2>
            {course.sections.map((section) => (
              <div className="border border-border bg-card p-5" key={section.id}>
                <p className="font-mono text-xs text-muted-foreground">
                  Section {section.position + 1}
                </p>
                <h3 className="mt-2 text-xl">{section.title}</h3>
                <div className="mt-4 space-y-2">
                  {section.lectures.map((lecture) => (
                    <div
                      className="flex items-center justify-between text-sm text-muted-foreground"
                      key={lecture.id}
                    >
                      <span>{lecture.title}</span>
                      {lecture.isPreview ? <span>Free preview</span> : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit border border-border bg-card p-6">
          <p className="font-mono text-sm text-muted-foreground">Enrollment</p>
          <p className="mt-4 text-3xl">
            {Number(course.price) === 0
              ? "Free"
              : `${course.currency} ${course.price}`}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Paid courses use manual payment verification. Enrollment activates
            after admin approval.
          </p>
          <form action={createEnrollmentOrderAction} className="mt-6 space-y-3">
            <input name="courseId" type="hidden" value={course.id} />
            <input name="slug" type="hidden" value={course.slug} />
            <label className="block text-sm">
              Coupon code
              <input
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                name="couponCode"
                placeholder="Optional"
              />
            </label>
            <button
              className="w-full bg-primary px-4 py-3 text-center text-sm text-primary-foreground"
              type="submit"
            >
              Enroll
            </button>
          </form>
          <Link
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground"
            href="/auth/login"
          >
            Sign in first
          </Link>
        </aside>
      </section>
    </main>
  )
}
