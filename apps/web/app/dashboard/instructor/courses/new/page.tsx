import { createInstructorCourseAction } from "../actions"
import { CourseForm } from "../course-form"

export const dynamic = "force-dynamic"

export default function NewInstructorCoursePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">New course</p>
        <h1 className="mt-3 text-4xl tracking-tight">Create a course draft</h1>
        <div className="mt-8">
          <CourseForm
            action={createInstructorCourseAction}
            submitLabel="Create course"
          />
        </div>
      </section>
    </main>
  )
}
