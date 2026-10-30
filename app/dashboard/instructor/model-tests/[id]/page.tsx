import type {
  LeaderboardResponse,
  ModelTestDto,
  TopicReportResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"

export const dynamic = "force-dynamic"

export default async function InstructorModelTestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let test: ModelTestDto | null = null
  let leaderboard: LeaderboardResponse | null = null
  let report: TopicReportResponse | null = null
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
    try {
      report = await authenticatedApiFetch<TopicReportResponse>(
        `/model-tests/${id}/topic-report`,
        { cache: "no-store" }
      )
    } catch (error) {
      if (isMigrationPendingError(error)) migrationPending = true
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ইন্সট্রাক্টর · মডেল টেস্ট"
        lede="শিক্ষক হিসেবে আপনি পূর্ণ লিডারবোর্ড (ইমেইলসহ) ও টপিক রিপোর্ট দেখতে পাবেন।"
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
              <p>নেগেটিভ মার্ক (এই টেস্টের জন্য): {test.negativeMark}</p>
              <p>প্রশ্ন এলোমেলো: {test.shuffleQuestions ? "চালু" : "বন্ধ"}</p>
              <p>সর্বোচ্চ চেষ্টা: {test.maxAttempts}</p>
              <p>প্রশ্ন সংখ্যা: {test.questionCount ?? "—"}</p>
              <p>প্রকাশিত: {test.isPublished ? "হ্যাঁ" : "না"}</p>
            </CardContent>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-2">
                <h2 className="font-heading text-xl">
                  লিডারবোর্ড (পূর্ণ তালিকা)
                </h2>
                <p className="text-xs text-muted-foreground">
                  ক্রম: স্কোর বেশি → দ্রুত শেষ → আগে জমা।
                </p>
                {!leaderboard || leaderboard.leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    এখনও কোনো জমা দেওয়া চেষ্টা নেই।
                  </p>
                ) : (
                  leaderboard.leaderboard.map((entry) => (
                    <p className="text-sm" key={entry.userId}>
                      {entry.rank}. {entry.studentName ?? "নাম নেই"}
                      {entry.studentEmail
                        ? ` · ${entry.studentEmail}`
                        : ""} · {entry.score} পয়েন্ট
                    </p>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2">
                <h2 className="font-heading text-xl">টপিক রিপোর্ট</h2>
                {!report || report.topics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    এখনও কোনো জমা দেওয়া চেষ্টা নেই।
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {report.attemptsCount}টি চেষ্টার ভিত্তিতে।
                    </p>
                    {report.topics.map((topic) => (
                      <p className="text-sm" key={topic.topic}>
                        {topic.topic}: সঠিক {topic.correct} · ভুল {topic.wrong}{" "}
                        · ফাঁকা {topic.blank} · নির্ভুলতা {topic.accuracy}%
                      </p>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
