"use client"

import { useState, useTransition } from "react"
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
  const [answers, setAnswers] = useState<Record<string, string[]>>(() =>
    getInitialAnswers(quiz.questions),
  )
  const [result, setResult] = useState<QuizSubmissionResultDto | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const latestResult = result ?? quiz.latestAttempt

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
        setMessage(error instanceof Error ? error.message : "Quiz could not be submitted.")
      }
    })
  }

  return (
    <div className="grid gap-4 border border-border bg-background p-4">
      <div>
        <p className="font-mono text-xs text-muted-foreground">Quiz</p>
        <h3 className="mt-1 text-xl">{quiz.title}</h3>
        {latestResult ? (
          <p className="mt-2 font-mono text-sm text-primary">
            Score {latestResult.score}/{latestResult.totalQuestions} ·{" "}
            {latestResult.percentage}%
          </p>
        ) : null}
      </div>

      {quiz.questions.map((question) => (
        <fieldset className="grid gap-3" key={question.id}>
          <legend className="text-sm text-foreground">
            {question.questionText}
          </legend>
          {question.allowMultiple ? (
            <div className="grid gap-2">
              {question.options.map((option) => {
                const checked = (answers[question.id] ?? []).includes(option.id)

                return (
                  <label
                    className="flex items-center gap-2 border border-border px-3 py-2 text-sm text-muted-foreground"
                    key={option.id}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() =>
                        toggleMultiAnswer(question.id, option.id)
                      }
                    />
                    {option.optionText}
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
                  className="flex items-center gap-2 border border-border px-3 py-2 text-sm text-muted-foreground"
                  key={option.id}
                >
                  <RadioGroupItem value={option.id} />
                  {option.optionText}
                </label>
              ))}
            </RadioGroup>
          )}
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={isPending}
          onClick={submitQuiz}
          type="button"
        >
          {isPending ? "Submitting..." : "Submit quiz"}
        </Button>
        {message ? (
          <p className="text-sm text-destructive" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
