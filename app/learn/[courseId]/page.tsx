import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type {
  DiscussionListResponse,
  LearningCourseResponse,
} from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { ProgressThread } from "@/components/ui/progress-thread"

import { LearningPlayer } from "./learning-player"
import { DiscussionPanel } from "./discussion-panel"

interface LearnPageProps {
  params: Promise<{
    courseId: string
  }>
}

export const dynamic = "force-dynamic"

export default async function LearnPage({ params }: LearnPageProps) {
  const { courseId } = await params
  const payload = await authenticatedApiFetch<LearningCourseResponse>(
    `/learning/courses/${courseId}`,
    { cache: "no-store" }
  )
  const discussion = await authenticatedApiFetch<DiscussionListResponse>(
    `/community/courses/${courseId}/discussions`,
    { cache: "no-store" }
  )

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <section className="mx-auto max-w-6xl">
        <ProgressThread className="mb-8" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-xs tracking-wide text-muted-foreground">
              Course {payload.course.slug}
            </p>
            <h1 className="mt-3 font-heading text-4xl leading-[1.1] tracking-tight sm:text-5xl">
              {payload.course.title}
            </h1>
          </div>
          <Button className="w-fit" variant="outline">
            <Link href="/dashboard/student">
              <ArrowLeft className="size-3.5" />
              Dashboard
            </Link>
          </Button>
        </div>

        <LearningPlayer
          course={payload.course}
          learnerEmail={payload.learner.email}
          sections={payload.sections}
        />
        <DiscussionPanel courseId={courseId} discussion={discussion} />
      </section>
    </main>
  )
}
