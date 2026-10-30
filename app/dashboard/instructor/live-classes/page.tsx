import Link from "next/link"
import type {
  BatchListResponse,
  InstructorCourseListResponse,
  LiveClassAttendanceResponse,
  LiveClassListResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { SubmitButton } from "@/components/submit-button"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"
import { formatDateTime } from "@/lib/format"

import {
  addLiveClassRecordingAction,
  createLiveClassAction,
  markLiveClassAttendanceAction,
} from "./actions"

export const dynamic = "force-dynamic"

export default async function InstructorLiveClassesPage({
  searchParams,
}: {
  searchParams?: Promise<{ classId?: string }>
}) {
  const params = (await searchParams) ?? {}
  const selectedClassId = params.classId?.trim() || null
  let liveClasses: LiveClassListResponse["liveClasses"] = []
  let courses: InstructorCourseListResponse["courses"] = []
  let batches: BatchListResponse["batches"] = []
  let attendance: LiveClassAttendanceResponse["attendance"] = []
  let migrationPending = false
  let loadError: string | null = null

  try {
    const response = await authenticatedApiFetch<LiveClassListResponse>(
      "/instructor/live-classes",
      { cache: "no-store" }
    )
    liveClasses = response.liveClasses ?? []
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
    else loadError = "Live classes could not be loaded."
  }

  try {
    const response = await authenticatedApiFetch<InstructorCourseListResponse>(
      "/instructor/courses",
      { cache: "no-store" }
    )
    courses = response.courses
  } catch {
    courses = []
  }

  try {
    const response = await authenticatedApiFetch<BatchListResponse>(
      "/instructor/batches",
      { cache: "no-store" }
    )
    batches = response.batches ?? []
  } catch {
    batches = []
  }

  if (selectedClassId) {
    try {
      const response = await authenticatedApiFetch<
        LiveClassAttendanceResponse | LiveClassAttendanceResponse["attendance"]
      >(`/instructor/live-classes/${selectedClassId}/attendance`, {
        cache: "no-store",
      })
      attendance = Array.isArray(response)
        ? response
        : (response.attendance ?? [])
    } catch (error) {
      if (isMigrationPendingError(error)) migrationPending = true
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ইন্সট্রাক্টর · লাইভ ক্লাস"
        lede="লিংক-ভিত্তিক লাইভ ক্লাস — নিজস্ব ভিডিও সার্ভার নয়। শুধু Meet/Zoom/অন্য লিংক শিডিউল করুন, রেকর্ডিং লিংক যোগ করুন, আর উপস্থিতি নিজে মার্ক করুন।"
        title="লাইভ ক্লাস"
      />

      {migrationPending ? <MigrationNotice feature="লাইভ ক্লাস" /> : null}
      {loadError ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      <Card>
        <CardContent>
          <h2 className="font-heading text-xl">নতুন লাইভ ক্লাস শিডিউল করুন</h2>
          {courses.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              প্রথমে একটি কোর্স তৈরি করুন, তারপর লাইভ ক্লাস শিডিউল করতে পারবেন।
            </p>
          ) : (
            <form action={createLiveClassAction} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lc-course">কোর্স</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    id="lc-course"
                    name="courseId"
                    required
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lc-batch">ব্যাচ (ঐচ্ছিক)</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    id="lc-batch"
                    name="batchId"
                  >
                    <option value="">সব ব্যাচ</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lc-title">শিরোনাম</Label>
                <Input id="lc-title" name="title" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lc-start">শুরু</Label>
                  <Input
                    id="lc-start"
                    name="startsAt"
                    required
                    type="datetime-local"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lc-end">শেষ (ঐচ্ছিক)</Label>
                  <Input id="lc-end" name="endsAt" type="datetime-local" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lc-provider">প্ল্যাটফর্ম</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    id="lc-provider"
                    name="provider"
                    required
                  >
                    <option value="meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="other">অন্য</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lc-url">মিটিং লিংক</Label>
                  <Input
                    id="lc-url"
                    name="meetingUrl"
                    placeholder="https://meet.google.com/…"
                    required
                    type="url"
                  />
                </div>
              </div>
              <SubmitButton>লাইভ ক্লাস শিডিউল করুন</SubmitButton>
            </form>
          )}
        </CardContent>
      </Card>

      {selectedClassId ? (
        <Card>
          <CardContent className="space-y-2">
            <h2 className="font-heading text-xl">উপস্থিতি তালিকা</h2>
            <p className="text-sm text-muted-foreground">
              শুধু শিক্ষকের মার্ক করা উপস্থিতি — লিংকে ক্লিক করলেই উপস্থিতি ধরা
              হয় না।
            </p>
            {attendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                এখনও কোনো উপস্থিতি মার্ক করা হয়নি।
              </p>
            ) : (
              attendance.map((row) => (
                <p className="text-sm" key={row.userId}>
                  {row.studentName ?? row.userId}:{" "}
                  {row.present ? "উপস্থিত" : "অনুপস্থিত"}
                </p>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        <h2 className="font-heading text-2xl">আমার লাইভ ক্লাস</h2>
        {liveClasses.length === 0 ? (
          <EmptyState
            description="Schedule a link-based live class above. No native video is hosted here."
            title="এখনও কোনো লাইভ ক্লাস নেই"
          />
        ) : (
          liveClasses.map((liveClass) => (
            <Card key={liveClass.id}>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-xl">{liveClass.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {liveClass.courseTitle ?? liveClass.courseId ?? ""} ·{" "}
                      {liveClass.provider} · শুরু{" "}
                      {formatDateTime(liveClass.startsAt)}
                      {liveClass.endsAt
                        ? ` · শেষ ${formatDateTime(liveClass.endsAt)}`
                        : ""}
                    </p>
                    {liveClass.recordingUrl ? (
                      <p className="mt-1 text-sm">
                        রেকর্ডিং (লিংক মাত্র):{" "}
                        <a
                          className="underline"
                          href={liveClass.recordingUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {liveClass.recordingTitle ?? "রেকর্ডিং দেখুন"}
                        </a>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline">
                      <a
                        href={liveClass.meetingUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Join লিংক
                      </a>
                    </Button>
                    <Button variant="outline">
                      <Link
                        href={`/dashboard/instructor/live-classes?classId=${liveClass.id}`}
                      >
                        উপস্থিতি দেখুন
                      </Link>
                    </Button>
                  </div>
                </div>

                <form
                  action={addLiveClassRecordingAction}
                  className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_240px_auto]"
                >
                  <input
                    name="liveClassId"
                    type="hidden"
                    value={liveClass.id}
                  />
                  <div className="space-y-2">
                    <Label htmlFor={`rec-url-${liveClass.id}`}>
                      রেকর্ডিং URL (লিংক মাত্র — রেকর্ডিং সার্ভার নয়)
                    </Label>
                    <Input
                      id={`rec-url-${liveClass.id}`}
                      name="recordingUrl"
                      placeholder="https://…"
                      required
                      type="url"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`rec-title-${liveClass.id}`}>
                      রেকর্ডিং শিরোনাম (ঐচ্ছিক)
                    </Label>
                    <Input id={`rec-title-${liveClass.id}`} name="title" />
                  </div>
                  <div className="flex items-end">
                    <SubmitButton size="sm">রেকর্ডিং যোগ করুন</SubmitButton>
                  </div>
                </form>

                <form
                  action={markLiveClassAttendanceAction}
                  className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_160px_auto]"
                >
                  <input
                    name="liveClassId"
                    type="hidden"
                    value={liveClass.id}
                  />
                  <div className="space-y-2">
                    <Label htmlFor={`att-user-${liveClass.id}`}>
                      শিক্ষার্থীর ইউজার আইডি
                    </Label>
                    <Input
                      id={`att-user-${liveClass.id}`}
                      name="userId"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`att-present-${liveClass.id}`}>
                      উপস্থিতি (শুধু শিক্ষক মার্ক করবেন)
                    </Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      id={`att-present-${liveClass.id}`}
                      name="present"
                      required
                    >
                      <option value="yes">উপস্থিত</option>
                      <option value="no">অনুপস্থিত</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <SubmitButton size="sm">উপস্থিতি মার্ক করুন</SubmitButton>
                  </div>
                </form>
                <p className="text-xs text-muted-foreground">
                  লিংকে ক্লিক করলেই উপস্থিতি ধরা হয় না — উপস্থিতি শুধু শিক্ষকের
                  মার্ক করা।
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
