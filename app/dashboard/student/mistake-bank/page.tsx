import type { MistakeBankResponse } from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"

export const dynamic = "force-dynamic"

export default async function MistakeBankPage({
  searchParams,
}: {
  searchParams?: Promise<{ topic?: string; testId?: string }>
}) {
  const params = (await searchParams) ?? {}
  const query = new URLSearchParams()
  if (params.topic) query.set("topic", params.topic)
  if (params.testId) query.set("testId", params.testId)
  const queryString = query.toString()

  let questions: MistakeBankResponse["questions"] = []
  let migrationPending = false
  let loadError: string | null = null
  try {
    const response = await authenticatedApiFetch<MistakeBankResponse>(
      `/student/mistake-bank${queryString ? `?${queryString}` : ""}`,
      { cache: "no-store" }
    )
    questions = response.questions
  } catch (error) {
    if (isMigrationPendingError(error)) {
      migrationPending = true
    } else {
      loadError = "Mistake Bank could not be loaded."
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী · Mistake Bank"
        lede="শুধুমাত্র সেই প্রশ্নগুলোই এখানে আছে যেগুলো আপনি আগে চেষ্টা করে ভুল করেছেন। তাই সঠিক উত্তর ও ব্যাখ্যা দেখানো হচ্ছে। কখনও চেষ্টা করেননি এমন প্রশ্ন এখানে আসে না।"
        title="Mistake Bank"
      />
      <Card>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-3" method="get">
            <div className="space-y-2">
              <Label htmlFor="filter-topic">টপিক</Label>
              <Input
                defaultValue={params.topic ?? ""}
                id="filter-topic"
                name="topic"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-testId">টেস্ট আইডি</Label>
              <Input
                defaultValue={params.testId ?? ""}
                id="filter-testId"
                name="testId"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit">ফিল্টার করুন</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {migrationPending ? (
        <MigrationNotice feature="Mistake Bank" />
      ) : loadError ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : questions.length === 0 ? (
        <EmptyState
          description="Wrong answers from your submitted model tests will appear here with the correct answer and explanation."
          title="কোনো ভুল প্রশ্ন নেই"
        />
      ) : (
        <div className="grid gap-4">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardContent className="space-y-2">
                <p className="font-mono text-xs text-muted-foreground">
                  {[question.subject, question.chapter, question.topic]
                    .filter(Boolean)
                    .join(" · ")}
                  {question.difficulty ? ` · ${question.difficulty}` : ""}
                </p>
                <p>{question.questionText}</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {question.options.map((option) => (
                    <li key={option.id}>
                      {option.optionText}
                      {option.isCorrect ? " (সঠিক উত্তর)" : ""}
                    </li>
                  ))}
                </ul>
                {question.explanation ? (
                  <p className="text-sm text-muted-foreground">
                    ব্যাখ্যা: {question.explanation}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
