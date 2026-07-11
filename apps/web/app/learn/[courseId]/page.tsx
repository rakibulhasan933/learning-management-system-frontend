import type { LearningCourseResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

import { LearningPlayer } from "./learning-player"

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
    { cache: "no-store" },
  )

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Course {payload.course.slug}
        </p>
        <h1 className="mt-3 text-4xl tracking-tight">{payload.course.title}</h1>
        <LearningPlayer
          course={payload.course}
          learnerEmail={payload.learner.email}
          sections={payload.sections}
        />
      </section>
    </main>
  )
}
