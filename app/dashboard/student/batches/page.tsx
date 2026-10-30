import Link from "next/link"
import type { BatchLeaderboardResponse, DripStatusResponse } from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { SubmitButton } from "@/components/submit-button"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"
import { formatDateTime } from "@/lib/format"

import { joinBatchAction } from "./actions"

export const dynamic = "force-dynamic"

export default async function StudentBatchesPage({
  searchParams,
}: {
  searchParams?: Promise<{ batchId?: string }>
}) {
  const params = (await searchParams) ?? {}
  const batchId = params.batchId?.trim() || null
  let dripItems: DripStatusResponse["items"] = []
  let leaderboard: NonNullable<BatchLeaderboardResponse["leaderboard"]> = []
  let migrationPending = false
  let loadError: string | null = null

  if (batchId) {
    try {
      const response = await authenticatedApiFetch<DripStatusResponse>(
        `/batches/${batchId}/drip-status`,
        { cache: "no-store" }
      )
      dripItems = response.items ?? []
    } catch (error) {
      if (isMigrationPendingError(error)) migrationPending = true
      else loadError = "Drip status could not be loaded."
    }

    try {
      const response = await authenticatedApiFetch<BatchLeaderboardResponse>(
        `/batches/${batchId}/leaderboard`,
        { cache: "no-store" }
      )
      leaderboard = response.leaderboard ?? response.entries ?? []
    } catch (error) {
      if (isMigrationPendingError(error)) migrationPending = true
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী · ব্যাচ"
        lede="ব্যাচে যোগ দিন এবং আপনার ব্যাচের drip স্ট্যাটাস ও লিডারবোর্ড দেখুন। লিডারবোর্ডে অন্য শিক্ষার্থীর ইমেইল দেখানো হয় না।"
        title="আমার ব্যাচ"
      />

      <Card>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          <p>
            এই চুক্তিতে শিক্ষার্থীর ব্যাচ-তালিকার আলাদা এন্ডপয়েন্ট নেই, তাই এই
            পাতা কোনো তালিকা অনুমান করে দেখায় না। শিক্ষকের দেওয়া ব্যাচ আইডি
            দিয়ে যোগ দিন, তারপর একই আইডি দিয়ে drip ও লিডারবোর্ড দেখুন।
            ব্যাচ-ডেডলাইন দেখার আলাদা GET এন্ডপয়েন্টও চুক্তিতে নেই — ডেডলাইন
            শিক্ষক/কোর্স পাতা থেকে জানানো হবে।
          </p>
        </CardContent>
      </Card>

      {migrationPending ? <MigrationNotice feature="ব্যাচ" /> : null}
      {loadError ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="font-heading text-xl">ব্যাচে যোগ দিন</h2>
            <form action={joinBatchAction} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-batch">ব্যাচ আইডি</Label>
                <Input
                  defaultValue={batchId ?? ""}
                  id="join-batch"
                  name="batchId"
                  required
                />
              </div>
              <SubmitButton>ব্যাচে যোগ দিন</SubmitButton>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="font-heading text-xl">ব্যাচ দেখুন</h2>
            <form className="mt-4 space-y-4" method="get">
              <div className="space-y-2">
                <Label htmlFor="view-batch">ব্যাচ আইডি</Label>
                <Input
                  defaultValue={batchId ?? ""}
                  id="view-batch"
                  name="batchId"
                  required
                />
              </div>
              <Button type="submit">Drip ও লিডারবোর্ড দেখুন</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {batchId ? (
        <>
          <Card>
            <CardContent className="space-y-2">
              <h2 className="font-heading text-xl">Drip স্ট্যাটাস</h2>
              {dripItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  এই ব্যাচের কোনো drip আইটেম নেই।
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
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2">
              <h2 className="font-heading text-xl">ব্যাচ লিডারবোর্ড</h2>
              <p className="text-sm text-muted-foreground">
                ব্যাচ-স্কোপ — অন্য শিক্ষার্থীর ইমেইল দেখানো হয় না।
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
        </>
      ) : null}

      <Button variant="outline">
        <Link href="/dashboard/student/classes">আমার ক্লাস</Link>
      </Button>
    </div>
  )
}
