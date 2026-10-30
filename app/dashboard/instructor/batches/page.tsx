import Link from "next/link"
import type {
  BatchListResponse,
  InstructorCourseListResponse,
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

import { createBatchAction } from "./actions"

export const dynamic = "force-dynamic"

export default async function InstructorBatchesPage({
  searchParams,
}: {
  searchParams?: Promise<{ courseId?: string }>
}) {
  const params = (await searchParams) ?? {}
  const query = params.courseId
    ? `?courseId=${encodeURIComponent(params.courseId)}`
    : ""
  let batches: BatchListResponse["batches"] = []
  let courses: InstructorCourseListResponse["courses"] = []
  let migrationPending = false
  let loadError: string | null = null

  try {
    const response = await authenticatedApiFetch<BatchListResponse>(
      `/instructor/batches${query}`,
      { cache: "no-store" }
    )
    batches = response.batches ?? []
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
    else loadError = "Batches could not be loaded."
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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ইন্সট্রাক্টর · ব্যাচ"
        lede="শুধুমাত্র আপনার নিজের কোর্সের ব্যাচ। ব্যাচের ভেতরে মেম্বার, drip নিয়ম, ডেডলাইন, লিডারবোর্ড ও আসলেই পাঠানো ঘোষণা পরিচালনা করুন।"
        title="ব্যাচ"
      />

      {migrationPending ? <MigrationNotice feature="ব্যাচ" /> : null}
      {loadError ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      <Card>
        <CardContent>
          <h2 className="font-heading text-xl">নতুন ব্যাচ তৈরি করুন</h2>
          {courses.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              প্রথমে একটি কোর্স তৈরি করুন, তারপর সেই কোর্সের ব্যাচ বানাতে
              পারবেন।
            </p>
          ) : (
            <form action={createBatchAction} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="batch-course">কোর্স</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    id="batch-course"
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
                  <Label htmlFor="batch-name">ব্যাচের নাম</Label>
                  <Input id="batch-name" name="name" required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="batch-start">এনরোলমেন্ট শুরু (ঐচ্ছিক)</Label>
                  <Input
                    id="batch-start"
                    name="enrolmentStartAt"
                    type="datetime-local"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-end">এনরোলমেন্ট শেষ (ঐচ্ছিক)</Label>
                  <Input
                    id="batch-end"
                    name="enrolmentEndAt"
                    type="datetime-local"
                  />
                </div>
              </div>
              <SubmitButton>ব্যাচ তৈরি করুন</SubmitButton>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <h2 className="font-heading text-xl">আমার ব্যাচ</h2>
          {params.courseId ? (
            <p className="text-sm text-muted-foreground">
              কোর্স ফিল্টার সক্রিয়।{" "}
              <Link className="underline" href="/dashboard/instructor/batches">
                সব ব্যাচ দেখুন
              </Link>
            </p>
          ) : null}
          {batches.length === 0 ? (
            <EmptyState
              description="Create a batch above for one of your own courses."
              title="এখনও কোনো ব্যাচ নেই"
            />
          ) : (
            batches.map((batch) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                key={batch.id}
              >
                <div className="text-sm">
                  <p className="font-medium">{batch.name}</p>
                  <p className="text-muted-foreground">
                    {batch.courseTitle ?? batch.courseId ?? ""}
                    {batch.memberCount !== null &&
                    batch.memberCount !== undefined
                      ? ` · ${batch.memberCount} জন মেম্বার`
                      : ""}
                    {batch.enrolmentStartAt
                      ? ` · শুরু ${formatDateTime(batch.enrolmentStartAt)}`
                      : ""}
                    {batch.enrolmentEndAt
                      ? ` · শেষ ${formatDateTime(batch.enrolmentEndAt)}`
                      : ""}
                  </p>
                </div>
                <Button variant="outline">
                  <Link href={`/dashboard/instructor/batches/${batch.id}`}>
                    বিস্তারিত
                  </Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
