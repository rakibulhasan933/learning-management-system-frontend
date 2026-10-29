import type { LiveClassListResponse } from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"
import { formatDateTime } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function StudentLiveClassesPage() {
  let liveClasses: LiveClassListResponse["liveClasses"] = []
  let migrationPending = false
  let loadError: string | null = null

  try {
    const response = await authenticatedApiFetch<LiveClassListResponse>(
      "/student/live-classes",
      { cache: "no-store" }
    )
    liveClasses = response.liveClasses ?? []
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
    else loadError = "Live classes could not be loaded."
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী · লাইভ ক্লাস"
        lede="আপনার কোর্স/ব্যাচের লিংক-ভিত্তিক লাইভ ক্লাসের শিডিউল, Join লিংক ও রেকর্ডিং লিংক। উপস্থিতি শুধু শিক্ষকের মার্ক করা — লিংকে ক্লিক করলেই উপস্থিতি ধরা হয় না।"
        title="লাইভ ক্লাস"
      />

      {migrationPending ? (
        <MigrationNotice feature="লাইভ ক্লাস" />
      ) : null}
      {loadError ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      {liveClasses.length === 0 ? (
        <EmptyState
          description="Scheduled live classes for your enrolled courses will appear here with a join link."
          title="এখনও কোনো লাইভ ক্লাস নেই"
        />
      ) : (
        <div className="space-y-4">
          {liveClasses.map((liveClass) => (
            <Card key={liveClass.id}>
              <CardContent className="space-y-3">
                <h2 className="font-heading text-xl">{liveClass.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {liveClass.courseTitle ?? liveClass.courseId ?? ""} ·{" "}
                  {liveClass.provider} · শুরু{" "}
                  {formatDateTime(liveClass.startsAt)}
                  {liveClass.endsAt
                    ? ` · শেষ ${formatDateTime(liveClass.endsAt)}`
                    : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <a
                      href={liveClass.meetingUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      ক্লাসে যোগ দিন (Join)
                    </a>
                  </Button>
                  {liveClass.recordingUrl ? (
                    <Button asChild variant="outline">
                      <a
                        href={liveClass.recordingUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {liveClass.recordingTitle ?? "রেকর্ডিং দেখুন"}
                      </a>
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  রেকর্ডিং শুধু একটি লিংক — এই প্ল্যাটফর্ম রেকর্ডিং সার্ভার
                  নয়।
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
