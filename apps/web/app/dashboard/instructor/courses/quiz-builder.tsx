"use client"

import { useState, useTransition } from "react"
import type { InstructorQuizDto } from "@workspace/types"

import {
  deleteInstructorQuizAction,
  saveInstructorQuizAction,
} from "./actions"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { FloatingInput } from "@workspace/ui/components/floating-input"

interface QuizBuilderProps {
  courseId: string
  quiz: InstructorQuizDto | null
  targetId: string
  targetLabel: string
  targetType: "lecture" | "section"
}

interface OptionState {
  isCorrect: boolean
  optionText: string
}

interface QuestionState {
  options: OptionState[]
  questionText: string
}

function getInitialQuestions(quiz: InstructorQuizDto | null): QuestionState[] {
  if (!quiz) {
    return [
      {
        options: [
          { isCorrect: true, optionText: "" },
          { isCorrect: false, optionText: "" },
        ],
        questionText: "",
      },
    ]
  }

  return quiz.questions.map((question) => ({
    options: question.options.map((option) => ({
      isCorrect: option.isCorrect,
      optionText: option.optionText,
    })),
    questionText: question.questionText,
  }))
}

export function QuizBuilder({
  courseId,
  quiz,
  targetId,
  targetLabel,
  targetType,
}: QuizBuilderProps) {
  const [title, setTitle] = useState(quiz?.title ?? `${targetLabel} quiz`)
  const [isPublished, setIsPublished] = useState(quiz?.isPublished ?? false)
  const [questions, setQuestions] = useState(() => getInitialQuestions(quiz))
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function updateQuestion(index: number, questionText: string) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, questionText } : question,
      ),
    )
  }

  function updateOption(
    questionIndex: number,
    optionIndex: number,
    patch: Partial<OptionState>,
  ) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) =>
        currentQuestionIndex === questionIndex
          ? {
              ...question,
              options: question.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex
                  ? { ...option, ...patch }
                  : option,
              ),
            }
          : question,
      ),
    )
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        options: [
          { isCorrect: true, optionText: "" },
          { isCorrect: false, optionText: "" },
        ],
        questionText: "",
      },
    ])
  }

  function removeQuestion(index: number) {
    setQuestions((current) =>
      current.length === 1
        ? current
        : current.filter((_, questionIndex) => questionIndex !== index),
    )
  }

  function addOption(questionIndex: number) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) =>
        currentQuestionIndex === questionIndex
          ? {
              ...question,
              options: [...question.options, { isCorrect: false, optionText: "" }],
            }
          : question,
      ),
    )
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) =>
        currentQuestionIndex === questionIndex
          ? {
              ...question,
              options:
                question.options.length <= 2
                  ? question.options
                  : question.options.filter(
                      (_, currentOptionIndex) => currentOptionIndex !== optionIndex,
                    ),
            }
          : question,
      ),
    )
  }

  function saveQuiz() {
    setMessage(null)
    startTransition(async () => {
      try {
        await saveInstructorQuizAction({
          courseId,
          isPublished,
          questions: questions.map((question, questionIndex) => ({
            options: question.options.map((option, optionIndex) => ({
              isCorrect: option.isCorrect,
              optionText: option.optionText,
              position: optionIndex,
            })),
            position: questionIndex,
            questionText: question.questionText,
          })),
          targetId,
          targetType,
          title,
        })
        setMessage("Quiz saved.")
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Quiz could not be saved.")
      }
    })
  }

  function deleteQuiz() {
    if (!quiz) {
      return
    }

    setMessage(null)
    startTransition(async () => {
      try {
        await deleteInstructorQuizAction({ courseId, quizId: quiz.id })
        setMessage("Quiz deleted.")
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Quiz could not be deleted.",
        )
      }
    })
  }

  return (
    <div className="grid gap-4 border border-border bg-background p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <FloatingInput
            label="Quiz title"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-muted-foreground">
          <Checkbox
            checked={isPublished}
            onCheckedChange={(checked) => setIsPublished(Boolean(checked))}
          />
          Published
        </label>
      </div>

      {questions.map((question, questionIndex) => (
        <div className="grid gap-3 border-l border-primary pl-4" key={questionIndex}>
          <div className="flex gap-3">
            <div className="flex-1">
              <FloatingInput
                label={`Question ${questionIndex + 1}`}
                onChange={(event) =>
                  updateQuestion(questionIndex, event.target.value)
                }
                value={question.questionText}
              />
            </div>
            <Button
              className="mt-7 h-fit"
              onClick={() => removeQuestion(questionIndex)}
              type="button"
              variant="destructive"
            >
              Remove
            </Button>
          </div>
          <div className="grid gap-2">
            {question.options.map((option, optionIndex) => (
              <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]" key={optionIndex}>
                <FloatingInput
                  onChange={(event) =>
                    updateOption(questionIndex, optionIndex, {
                      optionText: event.target.value,
                    })
                  }
                  label={`Option ${optionIndex + 1}`}
                  value={option.optionText}
                />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={option.isCorrect}
                    onCheckedChange={(checked) =>
                      updateOption(questionIndex, optionIndex, {
                        isCorrect: Boolean(checked),
                      })
                    }
                  />
                  Correct
                </label>
                <Button
                  variant="ghost"
                  onClick={() => removeOption(questionIndex, optionIndex)}
                  type="button"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Button
            className="w-fit"
            onClick={() => addOption(questionIndex)}
            type="button"
            variant="outline"
          >
            Add option
          </Button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={addQuestion}
          type="button"
          variant="outline"
        >
          Add question
        </Button>
        <Button
          disabled={isPending}
          onClick={saveQuiz}
          type="button"
        >
          {isPending ? "Saving..." : "Save quiz"}
        </Button>
        {quiz ? (
          <Button
            disabled={isPending}
            onClick={deleteQuiz}
            type="button"
            variant="destructive"
          >
            Delete quiz
          </Button>
        ) : null}
        {message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
