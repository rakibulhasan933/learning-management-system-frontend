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
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Editing {course.slug}
        </p>
        <h1 className="mt-3 text-3xl tracking-tight sm:text-4xl">{course.title}</h1>
        <div className="mt-8">
          <CourseForm
            action={updateInstructorCourseAction}
            course={course}
            submitLabel="Save changes"
          />
        </div>
        <div className="mt-10">
          <CourseOutlineEditor courseId={course.id} outline={outline} />
        </div>
        <Card className="mt-6 border-destructive/40 bg-card">
          <CardContent className="grid gap-4 p-5">
            <form action={deleteInstructorCourseAction} className="grid gap-4">
              <input name="courseId" type="hidden" value={course.id} />
              <p className="text-sm text-muted-foreground">
                Delete this course draft and its sections. Use this only for
                courses that should be permanently removed.
              </p>
              <Button className="w-full sm:w-fit" type="submit" variant="destructive">
                Delete course
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
