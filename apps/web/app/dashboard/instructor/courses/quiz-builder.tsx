"use client"

import { useState, useTransition } from "react"
import type { InstructorQuizDto } from "@workspace/types"

import {
  deleteInstructorQuizAction,
  saveInstructorQuizAction,
} from "./actions"

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
        <label className="block flex-1 text-sm">
          Quiz title
          <input
            className="mt-2 w-full border border-input bg-card px-3 py-2 text-foreground outline-none focus:border-primary"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
            type="checkbox"
          />
          Published
        </label>
      </div>

      {questions.map((question, questionIndex) => (
        <div className="grid gap-3 border-l border-primary pl-4" key={questionIndex}>
          <div className="flex gap-3">
            <label className="block flex-1 text-sm">
              Question {questionIndex + 1}
              <input
                className="mt-2 w-full border border-input bg-card px-3 py-2 text-foreground outline-none focus:border-primary"
                onChange={(event) =>
                  updateQuestion(questionIndex, event.target.value)
                }
                value={question.questionText}
              />
            </label>
            <button
              className="mt-7 h-fit border border-destructive px-3 py-2 text-sm text-destructive"
              onClick={() => removeQuestion(questionIndex)}
              type="button"
            >
              Remove
            </button>
          </div>
          <div className="grid gap-2">
            {question.options.map((option, optionIndex) => (
              <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]" key={optionIndex}>
                <input
                  className="border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  onChange={(event) =>
                    updateOption(questionIndex, optionIndex, {
                      optionText: event.target.value,
                    })
                  }
                  placeholder={`Option ${optionIndex + 1}`}
                  value={option.optionText}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    checked={option.isCorrect}
                    onChange={(event) =>
                      updateOption(questionIndex, optionIndex, {
                        isCorrect: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  Correct
                </label>
                <button
                  className="border border-border px-3 py-2 text-sm text-muted-foreground"
                  onClick={() => removeOption(questionIndex, optionIndex)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            className="w-fit border border-primary px-3 py-2 text-sm text-primary"
            onClick={() => addOption(questionIndex)}
            type="button"
          >
            Add option
          </button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="border border-primary px-4 py-2 text-sm text-primary"
          onClick={addQuestion}
          type="button"
        >
          Add question
        </button>
        <button
          className="bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
          disabled={isPending}
          onClick={saveQuiz}
          type="button"
        >
          {isPending ? "Saving..." : "Save quiz"}
        </button>
        {quiz ? (
          <button
            className="border border-destructive px-4 py-2 text-sm text-destructive"
            disabled={isPending}
            onClick={deleteQuiz}
            type="button"
          >
            Delete quiz
          </button>
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
