import Link from "next/link"

import type {
  InstructorCourseListResponse,
  QuestionBankListResponse,
} from "@/lib/types"
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

import { AttachQuestionForm, QuestionImportForm } from "./question-bank-client"

export const dynamic = "force-dynamic"

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams?: Promise<{
    subject?: string
    chapter?: string
    topic?: string
    difficulty?: string
    courseId?: string
  }>
}) {
  const params = (await searchParams) ?? {}
  const query = new URLSearchParams()
  for (const key of ["subject", "chapter", "topic", "difficulty", "courseId"] as const) {
    if (params[key]) query.set(key, params[key])
  }
  const queryString = query.toString()

  let questions: QuestionBankListResponse["questions"] = []
  let migrationPending = false
  let loadError: string | null = null
  try {
    const response = await authenticatedApiFetch<QuestionBankListResponse>(
      `/instructor/question-bank${queryString ? `?${queryString}` : ""}`,
      { cache: "no-store" }
    )
    questions = response.questions
  } catch (error) {
    if (isMigrationPendingError(error)) {
      migrationPending = true
    } else {
      loadError = "Question bank could not be loaded."
    }
  }

  let courses: InstructorCourseListResponse["courses"] = []
  try {
    const response =
      await authenticatedApiFetch<InstructorCourseListResponse>(
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
        eyebrow="ইন্সট্রাক্টর · প্রশ্নব্যাংক"
        lede="একটি প্রশ্ন একাধিক টেস্টে পুনঃব্যবহার করুন — প্রশ্নের লেখা কপি না করে যুক্ত করুন।"
        title="প্রশ্নব্যাংক"
      />

      <Card>
        <CardContent className="space-y-2">
          <h2 className="font-heading text-xl">CSV আমদানি</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            কলাম: question, options (pipe দিয়ে আলাদা) অথবা option1–option5,
            correct (অক্ষর, সূচক বা হুবহু অপশন লেখা), subject, chapter,
            topic, difficulty (easy / medium / hard, ডিফল্ট medium),
            explanation। ত্রুটিপূর্ণ লাইন বাদ যাবে, পুরো আমদানি ব্যর্থ হবে না।
          </p>
          <QuestionImportForm />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-heading text-xl">ফিল্টার</h2>
          <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="get">
            {(
              [
                ["subject", "বিষয়"],
                ["chapter", "অধ্যায়"],
                ["topic", "টপিক"],
                ["difficulty", "কঠিনতা"],
              ] as const
            ).map(([name, label]) => (
              <div className="space-y-2" key={name}>
                <Label htmlFor={`filter-${name}`}>{label}</Label>
                <Input
                  defaultValue={params[name] ?? ""}
                  id={`filter-${name}`}
                  name={name}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="filter-courseId">কোর্স</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={params.courseId ?? ""}
                id="filter-courseId"
                name="courseId"
              >
                <option value="">সব কোর্স</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit">ফিল্টার করুন</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {migrationPending ? (
        <MigrationNotice feature="প্রশ্নব্যাংক" />
      ) : loadError ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : questions.length === 0 ? (
        <EmptyState
          description="Import a CSV above, or questions you add to the bank will appear here."
          title="কোনো প্রশ্ন নেই"
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
                <AttachQuestionForm questionId={question.id} />
                <p className="text-xs text-muted-foreground">
                  একই প্রশ্ন একাধিক টেস্টে যুক্ত করা যায়, লেখা কপি করতে হয় না।
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div>
        <Button asChild variant="outline">
          <Link href="/dashboard/instructor/model-tests">
            মডেল টেস্ট তৈরি করুন
          </Link>
        </Button>
      </div>
    </div>
  )
}
