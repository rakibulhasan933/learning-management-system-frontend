import Link from "next/link"
import type {
  BatchDetailResponse,
  BatchDto,
  BatchLeaderboardResponse,
  DripStatusResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { SubmitButton } from "@/components/submit-button"
import { Textarea } from "@/components/ui/textarea"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"
import { formatDateTime } from "@/lib/format"

import {
  addBatchDeadlineAction,
  addBatchDripAction,
  addBatchMemberAction,
  sendBatchAnnouncementAction,
} from "./actions"

export const dynamic = "force-dynamic"

export default async function InstructorBatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ announced?: string }>
}) {
  const { id } = await params
  const query = (await searchParams) ?? {}
  let batch: BatchDto | null = null
  let members: NonNullable<BatchDetailResponse["members"]> = []
  let dripItems: DripStatusResponse["items"] = []
  let leaderboard: NonNullable<BatchLeaderboardResponse["leaderboard"]> = []
  let migrationPending = false
  let loadError: string | null = null

  try {
    const response = await authenticatedApiFetch<BatchDetailResponse>(
      `/instructor/batches/${id}`,
      { cache: "no-store" }
    )
    batch = response.batch ?? {
      courseId: response.courseId ?? null,
      courseTitle: response.courseTitle ?? null,
      createdAt: response.createdAt ?? null,
      enrolmentEndAt: response.enrolmentEndAt ?? null,
      enrolmentStartAt: response.enrolmentStartAt ?? null,
      id: response.id ?? id,
      memberCount: response.memberCount ?? null,
      name: response.name ?? "ব্যাচ",
    }
    members = response.members ?? []
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
    else loadError = "Batch could not be loaded."
  }

  try {
    const response = await authenticatedApiFetch<DripStatusResponse>(
      `/batches/${id}/drip-status`,
      { cache: "no-store" }
    )
    dripItems = response.items ?? []
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
  }

  try {
    const response = await authenticatedApiFetch<BatchLeaderboardResponse>(
      `/batches/${id}/leaderboard`,
      { cache: "no-store" }
    )
    leaderboard = response.leaderboard ?? response.entries ?? []
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ইন্সট্রাক্টর · ব্যাচ বিস্তারিত"
        lede="শুধুমাত্র আপনার নিজের ব্যাচের মেম্বার, drip, ডেডলাইন ও লিডারবোর্ড। লিডারবোর্ডে অন্য শিক্ষার্থীর ইমেইল দেখানো হয় না।"
        title={batch?.name ?? "ব্যাচ"}
      />

      {query.announced !== undefined ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm">
          ঘোষণা পাঠানো হয়েছে — {query.announced} জন প্রাপক। এটি
          সেলার-ড্যাশবোর্ডের খসড়া-মাত্র ঘোষণা নয়; এখানে রেকর্ড তৈরি হয়েছে।
          ইমেইল/SMS পাঠানো হয়েছে বলে দাবি করা হচ্ছে না।
        </p>
      ) : null}
      {migrationPending ? <MigrationNotice feature="ব্যাচ বিস্তারিত" /> : null}
      {loadError ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      {batch ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              কোর্স: {batch.courseTitle ?? batch.courseId ?? "—"}
              {batch.enrolmentStartAt
                ? ` · এনরোলমেন্ট শুরু ${formatDateTime(batch.enrolmentStartAt)}`
                : ""}
              {batch.enrolmentEndAt
                ? ` · শেষ ${formatDateTime(batch.enrolmentEndAt)}`
                : ""}
            </p>
            <Button className="mt-4" variant="outline">
              <Link href="/dashboard/instructor/batches">সব ব্যাচ</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="font-heading text-xl">মেম্বার যোগ করুন</h2>
            <form action={addBatchMemberAction} className="mt-4 space-y-4">
              <input name="batchId" type="hidden" value={id} />
              <div className="space-y-2">
                <Label htmlFor="member-user">শিক্ষার্থীর ইউজার আইডি</Label>
                <Input id="member-user" name="userId" required />
              </div>
              <SubmitButton>মেম্বার যোগ করুন</SubmitButton>
            </form>
            <div className="mt-6 space-y-2">
              <h3 className="font-medium">মেম্বার ({members.length} জন)</h3>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  এখনও কোনো মেম্বার তালিকা পাওয়া যায়নি।
                </p>
              ) : (
                members.map((member) => (
                  <p className="text-sm" key={member.userId}>
                    {member.fullName ?? member.studentName ?? member.userId}
                  </p>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="font-heading text-xl">Drip নিয়ম যোগ করুন</h2>
            <form action={addBatchDripAction} className="mt-4 space-y-4">
              <input name="batchId" type="hidden" value={id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="drip-milestone">
                    মাইলস্টোন আইডি (ঐচ্ছিক)
                  </Label>
                  <Input id="drip-milestone" name="milestoneId" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drip-module">মডিউল আইডি (ঐচ্ছিক)</Label>
                  <Input id="drip-module" name="moduleId" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="drip-type">রিলিজের ধরন</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  id="drip-type"
                  name="releaseType"
                  required
                >
                  <option value="relative">আপেক্ষিক (দিন পরে)</option>
                  <option value="fixed">নির্দিষ্ট তারিখে</option>
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="drip-days">রিলিজ দিন (আপেক্ষিক হলে)</Label>
                  <Input
                    id="drip-days"
                    min={0}
                    name="releaseDays"
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drip-at">রিলিজ তারিখ (নির্দিষ্ট হলে)</Label>
                  <Input id="drip-at" name="releaseAt" type="datetime-local" />
                </div>
              </div>
              <SubmitButton>Drip নিয়ম যোগ করুন</SubmitButton>
            </form>
            <div className="mt-6 space-y-2">
              <h3 className="font-medium">Drip স্ট্যাটাস</h3>
              {dripItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  কোনো drip আইটেম নেই।
                </p>
              ) : (
                dripItems.map((item, index) => (
                  <p
                    className="text-sm"
                    key={`${item.milestoneId ?? ""}-${item.moduleId ?? ""}-${index}`}
                  >
                    {item.milestoneId ?? item.moduleId ?? "আইটেম"}:{" "}
                    {item.locked
                      ? `লক করা${item.unlocksAt ? ` · খুলবে ${formatDateTime(item.unlocksAt)}` : ""}`
                      : "খোলা"}
                  </p>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="font-heading text-xl">ডেডলাইন যোগ করুন</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              latePenaltyPercent শিক্ষক সেট না করলে ডিফল্ট ০ — অর্থাৎ দেরিতে জমা
              দিলেও নম্বর কাটা হবে না।
            </p>
            <form action={addBatchDeadlineAction} className="mt-4 space-y-4">
              <input name="batchId" type="hidden" value={id} />
              <div className="space-y-2">
                <Label htmlFor="deadline-assignment">অ্যাসাইনমেন্ট আইডি</Label>
                <Input id="deadline-assignment" name="assignmentId" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline-due">শেষ তারিখ</Label>
                <Input
                  id="deadline-due"
                  name="dueAt"
                  required
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline-penalty">
                  দেরির জরিমানা % (ফাঁকা রাখলে ০ — নম্বর কাটা হবে না)
                </Label>
                <Input
                  id="deadline-penalty"
                  max={100}
                  min={0}
                  name="latePenaltyPercent"
                  step="any"
                  type="number"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input name="allowLate" type="checkbox" />
                দেরিতে জমা দেওয়ার অনুমতি দিন
              </label>
              <SubmitButton>ডেডলাইন যোগ করুন</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="font-heading text-xl">
              ঘোষণা পাঠান — পাঠানো, খসড়া নয়
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              এই ফর্ম সত্যিই পাঠায় (রেকর্ড তৈরি হয়)। সেলার-ড্যাশবোর্ডের বাল্ক
              ঘোষণা শুধু খসড়া — তার সাথে গুলিয়ে ফেলবেন না। ইমেইল/SMS পাঠানো
              হয়েছে বলে এখানে দাবি করা হচ্ছে না।
            </p>
            <form
              action={sendBatchAnnouncementAction}
              className="mt-4 space-y-4"
            >
              <input name="batchId" type="hidden" value={id} />
              <div className="space-y-2">
                <Label htmlFor="ann-title">শিরোনাম</Label>
                <Input id="ann-title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ann-body">বার্তা</Label>
                <Textarea id="ann-body" name="body" required rows={4} />
              </div>
              <SubmitButton>ঘোষণা পাঠান</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="space-y-2">
          <h2 className="font-heading text-xl">ব্যাচ লিডারবোর্ড</h2>
          <p className="text-sm text-muted-foreground">
            ব্যাচ-স্কোপ লিডারবোর্ড — অন্য শিক্ষার্থীর ইমেইল এখানে দেখানো হয় না।
          </p>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              এখনও কোনো লিডারবোর্ড তথ্য নেই।
            </p>
          ) : (
            leaderboard.map((entry, index) => (
              <p className="text-sm" key={entry.userId}>
                {entry.rank ?? index + 1}.{" "}
                {entry.displayName ?? entry.studentName ?? entry.userId}
                {entry.score !== null && entry.score !== undefined
                  ? ` · স্কোর ${entry.score}`
                  : ""}
                {entry.progress !== null && entry.progress !== undefined
                  ? ` · অগ্রগতি ${entry.progress}%`
                  : ""}
              </p>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
