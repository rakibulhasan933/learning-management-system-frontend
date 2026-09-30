import Link from "next/link"
import type { InstructorCourseDto } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { CourseWorkspaceStepper } from "./course-workspace-stepper"

export const dynamic = "force-dynamic"

interface InstructorCourseWorkspacePageProps {
  params: Promise<{ id: string }>
}

export default async function InstructorCourseWorkspacePage({
  params,
}: InstructorCourseWorkspacePageProps) {
  const { id } = await params
  const course = await authenticatedApiFetch<InstructorCourseDto>(
    `/instructor/courses/${id}`,
    {
      cache: "no-store",
    }
  )

  return (
    <div className="grid gap-8">
      <PageHeader
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/instructor/courses">All courses</Link>
          </Button>
        }
        eyebrow="Course workspace"
        lede="Work through one clear step at a time. Choose a workspace below to continue."
        title={course.title}
      />

      <CourseWorkspaceStepper courseId={id} />
    </div>
  )
}
