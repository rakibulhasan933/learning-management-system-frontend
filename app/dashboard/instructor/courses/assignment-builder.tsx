"use client"

import { type FormEvent, useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { InstructorAssignmentDto } from "@/lib/types"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  deleteInstructorAssignmentAction,
  gradeAssignmentSubmissionAction,
  saveInstructorAssignmentAction,
} from "./actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FloatingInput } from "@/components/ui/floating-input"
import { FloatingTextarea } from "@/components/ui/floating-textarea"

interface AssignmentBuilderProps {
  assignment: InstructorAssignmentDto | null
  courseId: string
  targetId: string
  targetLabel: string
  targetType: "lecture" | "section" | "module"
}

type StatusMessage = { text: string; type: "success" | "error" } | null

function toDateTimeLocal(value: string | null) {
  return value ? value.slice(0, 16) : ""
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

function StatusMessage({ message }: { message: StatusMessage }) {
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

export function AssignmentBuilder({
  assignment,
  courseId,
  targetId,
  targetLabel,
  targetType,
}: AssignmentBuilderProps) {
  const [title, setTitle] = useState(
    assignment?.title ?? `${targetLabel} assignment`
  )
  const [instructions, setInstructions] = useState(
    assignment?.instructions ?? ""
  )
  const [maxScore, setMaxScore] = useState(assignment?.maxScore ?? 100)
  const [dueAt, setDueAt] = useState(toDateTimeLocal(assignment?.dueAt ?? null))
  const [isPublished, setIsPublished] = useState(
    assignment?.isPublished ?? false
  )
  const [message, setMessage] = useState<StatusMessage>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  function saveAssignment() {
    setMessage(null)
    startTransition(async () => {
      try {
        await saveInstructorAssignmentAction({
          courseId,
          dueAt: dueAt.trim().length > 0 ? dueAt : null,
          instructions,
          isPublished,
          maxScore,
          targetId,
          targetType,
          title,
        })
        setMessage({ text: "Assignment saved.", type: "success" })
      } catch (error) {
        setMessage({
          text:
            error instanceof Error
              ? error.message
              : "Assignment could not be saved.",
          type: "error",
        })
      }
    })
  }

  function deleteAssignment() {
    if (!assignment) {
      return
    }

    setMessage(null)
    startTransition(async () => {
      try {
        await deleteInstructorAssignmentAction({
          assignmentId: assignment.id,
          courseId,
        })
        setMessage({ text: "Assignment deleted.", type: "success" })
        setConfirmingDelete(false)
      } catch (error) {
        setMessage({
          text:
            error instanceof Error
              ? error.message
              : "Assignment could not be deleted.",
          type: "error",
        })
      }
    })
  }

  function gradeSubmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const submissionId = getOptionalString(formData, "submissionId")

    if (!submissionId) {
      return
    }

    setMessage(null)
    startTransition(async () => {
      try {
        await gradeAssignmentSubmissionAction({
          courseId,
          gradeFeedback: getOptionalString(formData, "gradeFeedback"),
          gradeScore: Number(formData.get("gradeScore")),
          submissionId,
        })
        setMessage({ text: "Grade saved.", type: "success" })
      } catch (error) {
        setMessage({
          text:
            error instanceof Error
              ? error.message
              : "Grade could not be saved.",
          type: "error",
        })
      }
    })
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/40 p-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_180px_auto] sm:items-end">
        <FloatingInput
          className="h-10 rounded-xl px-3 text-sm"
          label="Assignment title"
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
        <FloatingInput
          className="h-10 rounded-xl px-3 font-mono text-sm"
          label="Max score"
          min="1"
          onChange={(event) => setMaxScore(Number(event.target.value))}
          type="number"
          value={maxScore}
        />
        <FloatingInput
          className="h-10 rounded-xl px-3 font-mono text-sm"
          label="Due at"
          onChange={(event) => setDueAt(event.target.value)}
          type="datetime-local"
          value={dueAt}
        />
        <label className="flex items-center gap-2 pb-2 text-sm text-muted-foreground">
          <Checkbox
            checked={isPublished}
            onCheckedChange={(checked) => setIsPublished(Boolean(checked))}
          />
          Published
        </label>
      </div>

      <FloatingTextarea
        className="min-h-20 rounded-xl px-3 pt-4 pb-2 text-sm"
        label="Instructions"
        onChange={(event) => setInstructions(event.target.value)}
        value={instructions}
      />

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          className="w-full sm:w-auto"
          disabled={isPending}
          onClick={saveAssignment}
          size="sm"
          type="button"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Saving..." : "Save assignment"}
        </Button>
        {assignment ? (
          confirmingDelete ? (
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Button
                className="w-full sm:w-auto"
                disabled={isPending}
                onClick={deleteAssignment}
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
              Delete assignment
            </Button>
          )
        ) : null}
        <StatusMessage message={message} />
      </div>

      {assignment ? (
        <Accordion className="border-border/60 bg-card/80">
          <AccordionItem value="submissions">
            <AccordionTrigger className="px-3 py-2.5 text-sm">
              <div className="grid gap-1">
                <span>Submissions</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {assignment.submissions.length === 0
                    ? "No submissions yet."
                    : `${assignment.submissions.length} submitted`}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent keepMounted className="px-3 pb-3">
              <div className="grid gap-2 pt-3">
                {assignment.submissions.map((submission) => (
                  <Accordion
                    className="border-border/60 bg-background/40"
                    key={submission.id}
                  >
                    <AccordionItem value={submission.id}>
                      <AccordionTrigger className="px-3 py-2.5 text-sm">
                        <div className="grid gap-1 text-left">
                          <span className="font-medium text-foreground">
                            {submission.studentName ?? submission.studentEmail}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {submission.studentEmail} ·{" "}
                            {new Date(submission.submittedAt).toLocaleString()}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent keepMounted className="px-3 pb-3">
                        <form
                          className="grid gap-3 pt-3 text-sm"
                          key={submission.id}
                          onSubmit={gradeSubmission}
                        >
                          <input
                            name="submissionId"
                            type="hidden"
                            value={submission.id}
                          />
                          <p className="rounded-xl border border-border bg-background p-3 whitespace-pre-wrap text-muted-foreground">
                            {submission.submissionText}
                          </p>
                          <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)_auto]">
                            <FloatingInput
                              className="h-10 rounded-xl px-3 text-sm"
                              defaultValue={submission.gradeScore ?? ""}
                              label="Score"
                              max={assignment.maxScore}
                              min="0"
                              name="gradeScore"
                              required
                              type="number"
                            />
                            <FloatingInput
                              className="h-10 rounded-xl px-3 text-sm"
                              defaultValue={submission.gradeFeedback ?? ""}
                              label="Feedback"
                              name="gradeFeedback"
                            />
                            <Button
                              className="h-fit w-full gap-2 self-end sm:w-auto"
                              disabled={isPending}
                              size="sm"
                              type="submit"
                              variant="outline"
                            >
                              {isPending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : null}
                              {isPending ? "Saving grade..." : "Save grade"}
                            </Button>
                          </div>
                          {submission.gradedAt ? (
                            <p className="font-mono text-xs text-muted-foreground">
                              Graded{" "}
                              {new Date(submission.gradedAt).toLocaleString()}
                              {submission.gradedByEmail
                                ? ` by ${submission.gradedByEmail}`
                                : ""}
                            </p>
                          ) : null}
                        </form>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  )
}
