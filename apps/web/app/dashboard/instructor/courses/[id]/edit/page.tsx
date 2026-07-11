import type {
  InstructorCourseDto,
  InstructorCourseOutlineResponse,
} from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

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
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Editing {course.slug}
        </p>
        <h1 className="mt-3 text-4xl tracking-tight">{course.title}</h1>
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
        <form
          action={deleteInstructorCourseAction}
          className="mt-6 border border-destructive/40 bg-destructive/10 p-5"
        >
          <input name="courseId" type="hidden" value={course.id} />
          <p className="text-sm text-muted-foreground">
            Delete this course draft and its sections. Use this only for courses
            that should be permanently removed.
          </p>
          <button
            className="mt-4 border border-destructive px-4 py-2 text-sm text-destructive"
            type="submit"
          >
            Delete course
          </button>
        </form>
      </section>
    </main>
  )
}
