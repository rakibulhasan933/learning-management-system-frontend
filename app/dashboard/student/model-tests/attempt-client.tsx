"use client"

import { useEffect, useMemo, useState } from "react"

import type { ModelTestAttemptDto, ModelTestSubmitResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import {
  startModelTestAttemptAction,
  submitModelTestAttemptAction,
} from "./actions"

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export function ModelTestAttemptClient({ testId }: { testId: string }) {
  const [attempt, setAttempt] = useState<ModelTestAttemptDto | null>(null)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [result, setResult] = useState<ModelTestSubmitResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const expiresAtMs = useMemo(
    () => (attempt ? new Date(attempt.expiresAt).getTime() : null),
    [attempt]
  )
  const expired = expiresAtMs !== null && now >= expiresAtMs

  useEffect(() => {
    if (!attempt || result) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [attempt, result])

  const toggleOption = (questionId: string, optionId: string) => {
    setAnswers((current) => {
      const selected = current[questionId] ?? []
      return {
        ...current,
        [questionId]: selected.includes(optionId)
          ? selected.filter((id) => id !== optionId)
          : [...selected, optionId],
      }
    })
  }

  if (result) {
    return (
      <Card>
        <CardContent className="space-y-3">
          <h2 className="font-heading text-2xl">ফলাফল</h2>
          <p className="text-sm">
            স্কোর: {result.score} / {result.totalQuestions} · সঠিক{" "}
            {result.correctCount} · ভুল {result.wrongCount} · ফাঁকা{" "}
            {result.blankCount} · {result.percentage}%
          </p>
          <p className="text-sm text-muted-foreground">
            এই টেস্টের নেগেটিভ মার্ক: {result.negativeMark} · কাটা গেছে:{" "}
            {result.negativeMarkApplied} · সময় লেগেছে:{" "}
            {result.finishedInSeconds} সেকেন্ড
          </p>
          {result.submittedLate ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              দেরিতে জমা দেওয়া হয়েছে (submittedLate) — নির্ধারিত সময় পেরিয়ে
              জমা দেওয়ায় স্কোর যেমন আছে তেমনই গণনা করা হয়েছে, জমা বাতিল করা
              হয়নি।
            </p>
          ) : null}
          <div className="space-y-1">
            <h3 className="font-medium">টপিকভিত্তিক ফল (আপনার চেষ্টা)</h3>
            {Object.entries(result.topicBreakdown).map(([topic, entry]) => (
              <p className="text-sm text-muted-foreground" key={topic}>
                {topic}: সঠিক {entry.correct} · ভুল {entry.wrong} · ফাঁকা{" "}
                {entry.blank} · মোট {entry.total}
              </p>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            ভুল হওয়া প্রশ্নগুলো Mistake Bank-এ পাবেন, সঠিক উত্তর ও ব্যাখ্যাসহ।
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!attempt) {
    return (
      <div className="space-y-2">
        <Button
          disabled={pending}
          onClick={async () => {
            setPending(true)
            setError(null)
            try {
              setAttempt(await startModelTestAttemptAction(testId))
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : "Attempt could not be started."
              )
            } finally {
              setPending(false)
            }
          }}
        >
          {pending ? "শুরু হচ্ছে…" : "টেস্ট শুরু করুন"}
        </Button>
        <p className="text-xs text-muted-foreground">
          প্রশ্নগুলোতে সঠিক উত্তর পাঠানো হয় না; টাইমার শেষ হলে জমা দিলেও স্কোর
          গণনা হবে এবং দেরি হিসেবে চিহ্নিত হবে।
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-heading text-xl">{attempt.title}</p>
          <p className="font-mono text-lg" role="timer">
            বাকি সময়:{" "}
            {expiresAtMs !== null ? formatRemaining(expiresAtMs - now) : "—"}
          </p>
          {expired ? (
            <p className="w-full rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              নির্ধারিত সময় শেষ। এখন জমা দিলে তা দেরি হিসেবে চিহ্নিত হবে,
              কিন্তু স্কোর গণনা হবে — জমা বাতিল হবে না।
            </p>
          ) : null}
        </CardContent>
      </Card>
      {attempt.questions.map((question, index) => (
        <Card key={question.id}>
          <CardContent className="space-y-2">
            <p className="font-mono text-xs text-muted-foreground">
              প্রশ্ন {index + 1}
              {question.topic ? ` · ${question.topic}` : ""}
              {question.difficulty ? ` · ${question.difficulty}` : ""}
            </p>
            <p>{question.questionText}</p>
            {question.options.map((option) => (
              <label
                className="flex items-center gap-2 text-sm"
                key={option.id}
              >
                <input
                  checked={(answers[question.id] ?? []).includes(option.id)}
                  onChange={() => toggleOption(question.id, option.id)}
                  type="checkbox"
                />
                {option.optionText}
              </label>
            ))}
          </CardContent>
        </Card>
      ))}
      <Button
        disabled={pending}
        onClick={async () => {
          setPending(true)
          setError(null)
          try {
            setResult(
              await submitModelTestAttemptAction(
                testId,
                attempt.attemptId,
                answers
              )
            )
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Attempt could not be submitted."
            )
          } finally {
            setPending(false)
          }
        }}
      >
        {pending ? "জমা হচ্ছে…" : "জমা দিন"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
