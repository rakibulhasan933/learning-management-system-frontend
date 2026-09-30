"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { InstructorQuizDto } from "@/lib/types"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FloatingInput } from "@/components/ui/floating-input"

import { deleteInstructorQuizAction, saveInstructorQuizAction } from "./actions"

interface QuizBuilderProps {
  courseId: string
  quiz: InstructorQuizDto | null
  targetId: string
  targetLabel: string
  targetType: "lecture" | "section" | "module"
}

interface OptionState {
  id: string
  isCorrect: boolean
  optionText: string
}

interface QuestionState {
  id: string
  options: OptionState[]
  questionText: string
}

type StatusMessage = { text: string; type: "success" | "error" } | null

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function createOptionState(optionText = "", isCorrect = false): OptionState {
  return {
    id: createId(),
    isCorrect,
    optionText,
  }
}

function createQuestionState(
  questionText = "",
  options = [createOptionState("", true), createOptionState("", false)]
): QuestionState {
  return {
    id: createId(),
    options,
    questionText,
  }
}

function getInitialQuestions(quiz: InstructorQuizDto | null): QuestionState[] {
  if (!quiz) {
    return [createQuestionState()]
  }

  return quiz.questions.map((question) => ({
    id: createId(),
    options: question.options.map((option) => ({
      id: createId(),
      isCorrect: option.isCorrect,
      optionText: option.optionText,
    })),
    questionText: question.questionText,
  }))
}

function StatusMessageText({ message }: { message: StatusMessage }) {
  if (!message) {
    return null
  }

  const isError = message.type === "error"

  return (
    <p
      className={`flex items-center gap-1.5 text-sm ${
        isError ? "text-destructive" : "text-secondary-foreground"
      }`}
      role="status"
    >
      {isError ? (
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      )}
      {message.text}
    </p>
  )
}

export function QuizBuilder({
  courseId,
  quiz,
  targetId,
  targetLabel,
  targetType,
}: QuizBuilderProps) {
  const [title, setTitle] = useState(quiz?.title ?? `${targetLabel} quiz`)
  const [isPublished, setIsPublished] = useState(quiz?.isPublished ?? true)
  const [questions, setQuestions] = useState(() => getInitialQuestions(quiz))
  const [message, setMessage] = useState<StatusMessage>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [openQuestions, setOpenQuestions] = useState<string[]>([])

  function updateQuestion(questionId: string, questionText: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? { ...question, questionText } : question
      )
    )
  }

  function updateOption(
    questionId: string,
    optionId: string,
    patch: Partial<Omit<OptionState, "id">>
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option) =>
                option.id === optionId ? { ...option, ...patch } : option
              ),
            }
          : question
      )
    )
  }

  function addQuestion() {
    const nextQuestion = createQuestionState()

    setQuestions((current) => [...current, nextQuestion])
    setOpenQuestions((current) =>
      current.includes(nextQuestion.id)
        ? current
        : [...current, nextQuestion.id]
    )
  }

  function removeQuestion(questionId: string) {
    setQuestions((current) =>
      current.filter((question) => question.id !== questionId)
    )
    setOpenQuestions((current) => current.filter((id) => id !== questionId))
  }

  function addOption(questionId: string) {
    const nextOption = createOptionState()

    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, options: [...question.options, nextOption] }
          : question
      )
    )
  }

  function removeOption(questionId: string, optionId: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options:
                question.options.length <= 2
                  ? question.options
                  : question.options.filter((option) => option.id !== optionId),
            }
          : question
      )
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
        setMessage({ text: "Quiz saved.", type: "success" })
      } catch (error) {
        setMessage({
          text:
            error instanceof Error ? error.message : "Quiz could not be saved.",
          type: "error",
        })
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
        setMessage({ text: "Quiz deleted.", type: "success" })
        setConfirmingDelete(false)
      } catch (error) {
        setMessage({
          text:
            error instanceof Error
              ? error.message
              : "Quiz could not be deleted.",
          type: "error",
        })
      }
    })
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/40 p-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <FloatingInput
          className="h-10 rounded-xl px-3 text-sm"
          label="Quiz title"
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground md:pb-2">
          <Checkbox
            checked={isPublished}
            onCheckedChange={(checked) => setIsPublished(Boolean(checked))}
          />
          Published
        </label>
      </div>

      <Accordion
        className="border-border/60 bg-card/80"
        multiple
        value={openQuestions}
        onValueChange={setOpenQuestions}
      >
        {questions.map((question, questionIndex) => {
          return (
            <AccordionItem key={question.id} value={question.id}>
              <div className="grid gap-2 border-b border-border/70 px-3 py-2.5">
                <AccordionTrigger className="w-full min-w-0 justify-start rounded-none p-0 text-left hover:bg-transparent">
                  <div className="grid min-w-0 gap-1.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h4 className="min-w-0 truncate font-heading text-sm font-medium tracking-tight md:text-base">
                        {question.questionText.trim().length > 0
                          ? question.questionText
                          : `Question ${questionIndex + 1}`}
                      </h4>
                      <span className="font-mono text-xs text-muted-foreground">
                        {question.options.length} option
                        {question.options.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click to edit question text and options
                    </p>
                  </div>
                </AccordionTrigger>
              </div>

              <AccordionContent keepMounted className="px-3 pb-3">
                <div className="grid gap-3 pt-3">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <FloatingInput
                      className="h-10 rounded-xl px-3 text-sm"
                      label={`Question ${questionIndex + 1}`}
                      onChange={(event) =>
                        updateQuestion(question.id, event.target.value)
                      }
                      value={question.questionText}
                    />
                    <Button
                      className="w-full md:w-auto"
                      onClick={() => removeQuestion(question.id)}
                      type="button"
                      variant="destructive"
                    >
                      Remove question
                    </Button>
                  </div>

                  <div className="grid gap-2 rounded-xl border border-border/60 bg-background/40 p-2">
                    <div className="flex items-center justify-between gap-3 px-1 py-1">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Options
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Select the correct answer.
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {question.options.length} total
                      </span>
                    </div>
                    {question.options.map((option, optionIndex) => (
                      <div
                        className="grid gap-2 rounded-lg border border-border bg-card p-2.5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                        key={option.id}
                      >
                        <FloatingInput
                          className="h-10 rounded-xl px-3 text-sm"
                          onChange={(event) =>
                            updateOption(question.id, option.id, {
                              optionText: event.target.value,
                            })
                          }
                          label={`Option ${optionIndex + 1}`}
                          value={option.optionText}
                        />
                        <label className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                          <Checkbox
                            checked={option.isCorrect}
                            onCheckedChange={(checked) =>
                              updateOption(question.id, option.id, {
                                isCorrect: Boolean(checked),
                              })
                            }
                          />
                          Correct
                        </label>
                        <Button
                          className="w-full sm:w-auto"
                          disabled={question.options.length <= 2}
                          onClick={() => removeOption(question.id, option.id)}
                          type="button"
                          variant="ghost"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => addOption(question.id)}
                      type="button"
                      variant="outline"
                    >
                      Add option
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          className="w-full sm:w-auto"
          onClick={addQuestion}
          size="sm"
          type="button"
          variant="outline"
        >
          Add question
        </Button>
        <Button
          className="w-full sm:w-auto"
          disabled={isPending}
          onClick={saveQuiz}
          size="sm"
          type="button"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Saving..." : "Save quiz"}
        </Button>
        {quiz ? (
          confirmingDelete ? (
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Button
                className="w-full sm:w-auto"
                disabled={isPending}
                onClick={deleteQuiz}
                size="sm"
                type="button"
                variant="destructive"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {isPending ? "Deleting..." : "Confirm delete"}
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={isPending}
                onClick={() => setConfirmingDelete(false)}
                size="sm"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              className="w-full sm:w-auto"
              disabled={isPending}
              onClick={() => setConfirmingDelete(true)}
              size="sm"
              type="button"
              variant="destructive"
            >
              Delete quiz
            </Button>
          )
        ) : null}
        <StatusMessageText message={message} />
      </div>
    </div>
  )
}
