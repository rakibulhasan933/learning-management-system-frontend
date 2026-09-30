import Link from "next/link"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import type {
  InstructorCourseDto,
  InstructorCourseStructureResponse,
} from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { SubmitButton } from "@/components/submit-button"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressThread } from "@/components/ui/progress-thread"

import {
  deleteInstructorCourseAction,
  updateInstructorCourseAction,
} from "../../actions"
import { CourseForm } from "../../course-form"
import { CourseEditWorkspace } from "./course-edit-workspace"
import { MilestoneModuleBuilder } from "../../milestone-module-builder-v2"

export const dynamic = "force-dynamic"

interface EditInstructorCoursePageProps {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    step?: "details" | "content" | "settings"
  }>
}

export default async function EditInstructorCoursePage({
  params,
  searchParams,
}: EditInstructorCoursePageProps) {
  const { id } = await params
  const query = searchParams ? await searchParams : undefined
  const [course, structure] = await Promise.all([
    authenticatedApiFetch<InstructorCourseDto>(`/instructor/courses/${id}`, {
      cache: "no-store",
    }),
    authenticatedApiFetch<InstructorCourseStructureResponse>(
      `/instructor/courses/${id}/milestones`,
      { cache: "no-store" }
    ),
  ])

  return (
    <main className="instructor-course-editor min-h-screen bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <div className="space-y-3">
          <ProgressThread />
          <Link
            className="interactive-link inline-flex items-center gap-1.5 text-xs text-muted-foreground"
            href="/dashboard/instructor/courses"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to courses
          </Link>
          <p className="font-mono text-sm text-muted-foreground">
            Editing {course.slug}
          </p>
          <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
            {course.title}
          </h1>
        </div>

        <CourseEditWorkspace
          content={
            <MilestoneModuleBuilder
              courseId={course.id}
              structure={structure}
            />
          }
          details={
            <CourseForm
              action={updateInstructorCourseAction}
              course={course}
              submitLabel="Save changes"
            />
          }
          settings={
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="grid gap-3 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <h3 className="font-heading text-sm font-medium text-destructive">
                    Danger zone
                  </h3>
                </div>
                <form
                  action={deleteInstructorCourseAction}
                  className="grid gap-3"
                >
                  <input name="courseId" type="hidden" value={course.id} />
                  <p className="text-sm text-muted-foreground">
                    Delete this course draft and its sections. Use this only for courses that should be permanently removed. This action cannot be undone.
                  </p>
                  <SubmitButton
                    className="w-full sm:w-fit"
                    pendingLabel="Deleting course..."
                    variant="destructive"
                  >
                    Delete course
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>
          }
          initialStep={query?.step ?? "details"}
        />
      </section>
    </main>
  )
}
