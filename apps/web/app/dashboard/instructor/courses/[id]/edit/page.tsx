import type {
  InstructorCourseDto,
  InstructorCourseOutlineResponse,
} from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"

import {
  deleteInstructorCourseAction,
  updateInstructorCourseAction,
} from "../../actions"
import { CourseOutlineEditor } from "../../course-outline-editor"
import { CourseForm } from "../../course-form"

export const dynamic = "force-dynamic"

interface EditInstructorCoursePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditInstructorCoursePage({
  params,
}: EditInstructorCoursePageProps) {
  const { id } = await params
  const [course, outline] = await Promise.all([
    authenticatedApiFetch<InstructorCourseDto>(`/instructor/courses/${id}`, {
      cache: "no-store",
    }),
    authenticatedApiFetch<InstructorCourseOutlineResponse>(
      `/instructor/courses/${id}/outline`,
      { cache: "no-store" },
    ),
  ])

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 sm:py-8">
      <section className="mx-auto grid max-w-5xl gap-5">
        <div className="space-y-3">
          <div className="h-px w-28 bg-primary" />
          <p className="font-mono text-sm text-muted-foreground">
            Editing {course.slug}
          </p>
          <h1 className="text-3xl tracking-tight sm:text-4xl">{course.title}</h1>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card ring-1 ring-foreground/10">
          <div className="divide-y divide-border/60">
            <div className="p-4 sm:p-5">
              <CourseForm
                action={updateInstructorCourseAction}
                course={course}
                submitLabel="Save changes"
              />
            </div>
            <div className="p-4 sm:p-5">
              <CourseOutlineEditor courseId={course.id} outline={outline} />
            </div>
            <div className="p-4 sm:p-5">
              <Card className="border-destructive/40 bg-background/40">
                <CardContent className="grid gap-3 p-4 sm:p-5">
                  <form action={deleteInstructorCourseAction} className="grid gap-3">
                    <input name="courseId" type="hidden" value={course.id} />
                    <p className="text-sm text-muted-foreground">
                      Delete this course draft and its sections. Use this only for
                      courses that should be permanently removed.
                    </p>
                    <Button
                      className="w-full sm:w-fit"
                      type="submit"
                      variant="destructive"
                    >
                      Delete course
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
