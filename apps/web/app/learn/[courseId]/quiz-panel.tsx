"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, CircleAlert, Loader2, LockKeyhole } from "lucide-react"
import type {
  QuizSubmissionResultDto,
  StudentQuizDto,
  StudentQuizQuestionDto,
} from "@workspace/types"

import { submitQuizAction } from "./actions"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"

interface QuizPanelProps {
  quiz: StudentQuizDto
}

function getInitialAnswers(questions: StudentQuizQuestionDto[]) {
  return Object.fromEntries(questions.map((question) => [question.id, []]))
}

export function QuizPanel({ quiz }: QuizPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string[]>>(
    () => quiz.review?.answers ?? getInitialAnswers(quiz.questions)
  )
  const [result, setResult] = useState<QuizSubmissionResultDto | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const latestResult = result ?? quiz.latestAttempt
  const isLocked = Boolean(latestResult)
  const review = result
    ? {
        answers,
        correctOptionIds: result.correctOptionIds,
        correctQuestionIds: result.correctQuestionIds,
      }
    : quiz.review

  function setSingleAnswer(questionId: string, optionId: string) {
    setAnswers((current) => ({ ...current, [questionId]: [optionId] }))
  }

  function toggleMultiAnswer(questionId: string, optionId: string) {
    setAnswers((current) => {
      const existing = current[questionId] ?? []

      return {
        ...current,
        [questionId]: existing.includes(optionId)
          ? existing.filter((id) => id !== optionId)
          : [...existing, optionId],
      }
    })
  }

  function submitQuiz() {
    setMessage(null)
    startTransition(async () => {
      try {
        const submissionResult = await submitQuizAction({
          answers,
          quizId: quiz.id,
        })

        setResult(submissionResult)
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Quiz could not be submitted."
        )
      }
    })
  }

  return (
    <div className="grid gap-5 rounded-2xl bg-background p-4 ring-1 ring-foreground/10 sm:p-6">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="font-mono text-xs tracking-wide text-muted-foreground">
          Quiz
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h3 className="font-heading text-xl tracking-tight">{quiz.title}</h3>
          {isLocked ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <LockKeyhole className="size-3.5" />
              Submitted
            </span>
          ) : null}
        </div>
        {latestResult ? (
          <p className="mt-3 flex items-center gap-2 font-mono text-sm text-primary">
            <CheckCircle2 className="size-4" />
            Score {latestResult.score}/{latestResult.totalQuestions} ·{" "}
            {latestResult.percentage}%
          </p>
        ) : null}
      </div>

      {quiz.questions.map((question) => (
        <fieldset
          className="grid gap-3 rounded-2xl border border-border p-4"
          disabled={isLocked}
          key={question.id}
        >
          <legend className="px-1 text-sm font-medium text-foreground">
            <span className="mr-2 font-mono text-xs text-primary">
              {String(question.position + 1).padStart(2, "0")}
            </span>
            {question.questionText}
          </legend>
          {question.allowMultiple ? (
            <div className="grid gap-2">
              {question.options.map((option) => {
                const checked = (answers[question.id] ?? []).includes(option.id)

                return (
                  <label
                    className={`interactive-card flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ring-1 ${review?.correctOptionIds[question.id]?.includes(option.id) ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/40" : review && (answers[question.id] ?? []).includes(option.id) ? "bg-destructive/10 text-destructive ring-destructive/40" : "text-muted-foreground ring-foreground/10"}`}
                    key={option.id}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={isLocked}
                      onCheckedChange={() =>
                        toggleMultiAnswer(question.id, option.id)
                      }
                    />
                    {option.optionText}
                    {review?.correctOptionIds[question.id]?.includes(
                      option.id
                    ) ? (
                      <CheckCircle2 className="ml-auto size-4 text-emerald-300" />
                    ) : review && checked ? (
                      <CircleAlert className="ml-auto size-4 text-destructive" />
                    ) : null}
                  </label>
                )
              })}
            </div>
          ) : (
            <RadioGroup
              className="grid gap-2"
              onValueChange={(value) => setSingleAnswer(question.id, value)}
              value={answers[question.id]?.[0] ?? ""}
            >
              {question.options.map((option) => (
                <label
                  className={`interactive-card flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ring-1 ${review?.correctOptionIds[question.id]?.includes(option.id) ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/40" : review && (answers[question.id] ?? []).includes(option.id) ? "bg-destructive/10 text-destructive ring-destructive/40" : "text-muted-foreground ring-foreground/10"}`}
                  key={option.id}
                >
                  <RadioGroupItem disabled={isLocked} value={option.id} />
                  {option.optionText}
                  {review?.correctOptionIds[question.id]?.includes(
                    option.id
                  ) ? (
                    <CheckCircle2 className="ml-auto size-4 text-emerald-300" />
                  ) : review &&
                    (answers[question.id] ?? []).includes(option.id) ? (
                    <CircleAlert className="ml-auto size-4 text-destructive" />
                  ) : null}
                </label>
              ))}
            </RadioGroup>
          )}
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={isPending || isLocked}
          onClick={submitQuiz}
          type="button"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {isPending
            ? "Submitting..."
            : isLocked
              ? "Quiz already submitted"
              : "Submit quiz"}
        </Button>
        {review ? (
          <p className="text-sm text-muted-foreground">
            Review mode: green answers are correct, and your selected wrong
            answers are marked in red.
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-destructive" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
