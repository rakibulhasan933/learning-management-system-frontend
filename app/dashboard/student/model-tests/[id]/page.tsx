import type { LeaderboardResponse, ModelTestDto } from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"

import { ModelTestAttemptClient } from "../attempt-client"

export const dynamic = "force-dynamic"

export default async function StudentModelTestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let test: ModelTestDto | null = null
  let leaderboard: LeaderboardResponse | null = null
  let migrationPending = false
  let loadError: string | null = null

  try {
    const response = await authenticatedApiFetch<{ test: ModelTestDto }>(
      `/model-tests/${id}`,
      { cache: "no-store" }
    )
    test = response.test
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
    else loadError = "Model test could not be loaded."
  }
  if (test) {
    try {
      leaderboard = await authenticatedApiFetch<LeaderboardResponse>(
        `/model-tests/${id}/leaderboard`,
        { cache: "no-store" }
      )
    } catch (error) {
      if (isMigrationPendingError(error)) migrationPending = true
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী · মডেল টেস্ট"
        lede="শিক্ষার্থী হিসেবে আপনি সেরা ১০ জন ও নিজের র‍্যাংক দেখতে পাবেন; কারও ইমেইল দেখানো হয় না।"
        title={test?.title ?? "মডেল টেস্ট"}
      />
      {migrationPending ? (
        <MigrationNotice feature="মডেল টেস্ট" />
      ) : loadError || !test ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError ?? "Model test could not be loaded."}
        </p>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-1 text-sm">
              <p>সময়: {test.durationMinutes} মিনিট</p>
              <p>এই টেস্টের নেগেটিভ মার্ক: {test.negativeMark}</p>
              <p>সর্বোচ্চ চেষ্টা: {test.maxAttempts}</p>
              <p>প্রশ্ন সংখ্যা: {test.questionCount ?? "—"}</p>
            </CardContent>
          </Card>
          <ModelTestAttemptClient testId={id} />
          <Card>
            <CardContent className="space-y-2">
              <h2 className="font-heading text-xl">লিডারবোর্ড</h2>
              <p className="text-xs text-muted-foreground">
                ক্রম: স্কোর বেশি → দ্রুত শেষ → আগে জমা। শিক্ষার্থীদের ইমেইল
                দেখানো হয় না।
              </p>
              {!leaderboard || leaderboard.leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  এখনও কোনো জমা দেওয়া চেষ্টা নেই।
                </p>
              ) : (
                leaderboard.leaderboard.map((entry) => (
                  <p className="text-sm" key={entry.userId}>
                    {entry.rank}. {entry.studentName ?? "নাম নেই"} ·{" "}
                    {entry.score} পয়েন্ট
                  </p>
                ))
              )}
              {leaderboard?.ownRank ? (
                <p className="text-sm font-medium">
                  আপনার র‍্যাংক: {leaderboard.ownRank}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
