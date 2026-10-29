"use client"

import { useState } from "react"

import type { QuestionImportResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/submit-button"

import {
  attachBankQuestionAction,
  importQuestionBankAction,
} from "./actions"

export function QuestionImportForm({
  courseId,
}: {
  courseId?: string
}) {
  const [report, setReport] = useState<QuestionImportResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <form
        action={async (formData: FormData) => {
          setError(null)
          setReport(null)
          try {
            setReport(await importQuestionBankAction(formData))
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Import could not be completed."
            )
          }
        }}
        className="space-y-4"
      >
        {courseId ? (
          <input name="courseId" type="hidden" value={courseId} />
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="csv-file">CSV ফাইল</Label>
          <Input accept=".csv,text/csv" id="csv-file" name="file" required type="file" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quiz-id">মডেল টেস্ট আইডি (ঐচ্ছিক — আমদানি করা প্রশ্ন সরাসরি যুক্ত হবে)</Label>
          <Input id="quiz-id" name="quizId" placeholder="মডেল টেস্টের UUID" />
        </div>
        <SubmitButton>আমদানি করুন</SubmitButton>
      </form>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {report ? (
        <div className="rounded-xl border border-border p-4 text-sm">
          <p>
            আমদানি হয়েছে: {report.imported}টি · বাদ দেওয়া হয়েছে:{" "}
            {report.skipped}টি
          </p>
          <p className="mt-1 text-muted-foreground">
            ত্রুটিপূর্ণ লাইনগুলো শুধু বাদ দেওয়া হয়েছে; পুরো আমদানি ব্যর্থ
            হয়নি।
          </p>
          {report.errors.length > 0 ? (
            <ul className="mt-2 list-disc pl-5 text-muted-foreground">
              {report.errors.map((item, index) => (
                <li key={`${item.line}-${index}`}>
                  লাইন {item.line}: {item.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function AttachQuestionForm({
  questionId,
}: {
  questionId: string
}) {
  return (
    <form
      action={async (formData) => {
        await attachBankQuestionAction(formData)
      }}
      className="mt-2 flex gap-2"
    >
      <input name="questionId" type="hidden" value={questionId} />
      <Input
        aria-label="মডেল টেস্ট আইডি"
        name="testId"
        placeholder="মডেল টেস্ট আইডি"
        required
      />
      <Button size="sm" type="submit" variant="outline">
        টেস্টে যুক্ত করুন
      </Button>
    </form>
  )
}
