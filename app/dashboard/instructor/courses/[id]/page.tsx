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
    <div className="instructor-course-workspace grid gap-8">
      <PageHeader
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/instructor/courses">সব কোর্স</Link>
          </Button>
        }
        eyebrow="কোর্স ওয়ার্কস্পেস"
        lede="একটি একটি করে ধাপ সম্পন্ন করুন। নিচের ওয়ার্কস্পেস থেকে কাজ শুরু করুন।"
        title={course.title}
      />

      <CourseWorkspaceStepper courseId={id} />
    </div>
  )
}
