import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProgressThread } from "@/components/ui/progress-thread"

import { createInstructorCourseAction } from "../actions"
import { CourseForm } from "../course-form"

export const dynamic = "force-dynamic"

export default function NewInstructorCoursePage() {
  return (
    <main className="w-full text-left text-foreground">
      <section className="w-full max-w-4xl">
        <ProgressThread className="mb-6" />
        <div className="flex flex-col items-start gap-5">
          <div className="max-w-2xl text-left">
            <p className="font-mono text-xs tracking-wide text-muted-foreground">
              New course
            </p>
            <h1 className="mt-3 font-heading text-4xl leading-[1.1] tracking-tight sm:text-5xl">
              Create a course draft
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Start with the essentials. You can add sections, lectures, video,
              and materials once the draft exists.
            </p>
          </div>
          <Button
            className="w-fit"
            render={<Link href="/dashboard/instructor/courses" />}
            variant="outline"
          >
            <ArrowLeft className="size-3.5" />
            All courses
          </Button>
        </div>

        <div className="mt-7">
          <CourseForm
            action={createInstructorCourseAction}
            submitLabel="Create course"
          />
        </div>
      </section>
    </main>
  )
}
