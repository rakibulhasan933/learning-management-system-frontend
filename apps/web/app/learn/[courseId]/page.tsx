interface LearnPageProps {
  params: Promise<{
    courseId: string
  }>
}

export const dynamic = "force-dynamic"

export default async function LearnPage({ params }: LearnPageProps) {
  const { courseId } = await params

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Course {courseId}
        </p>
        <h1 className="mt-3 text-4xl tracking-tight">Learning player</h1>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="aspect-video border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              The custom video player, signed video URL fetch, watermark overlay,
              and progress tracking will be implemented in the video milestone.
            </p>
          </div>
          <aside className="border border-border bg-card p-5">
            <p className="font-mono text-sm text-muted-foreground">
              Course outline
            </p>
            <div className="mt-4 h-px w-full bg-primary" />
          </aside>
        </div>
      </section>
    </main>
  )
}
