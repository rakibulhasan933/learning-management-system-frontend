"use client"

import { type FormEvent, useState, useTransition } from "react"
import type { InstructorAssignmentDto } from "@workspace/types"

import {
  deleteInstructorAssignmentAction,
  gradeAssignmentSubmissionAction,
  saveInstructorAssignmentAction,
} from "./actions"

interface AssignmentBuilderProps {
  assignment: InstructorAssignmentDto | null
  courseId: string
  targetId: string
  targetLabel: string
  targetType: "lecture" | "section"
}

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

export function AssignmentBuilder({
  assignment,
  courseId,
  targetId,
  targetLabel,
  targetType,
}: AssignmentBuilderProps) {
  const [title, setTitle] = useState(
    assignment?.title ?? `${targetLabel} assignment`,
  )
  const [instructions, setInstructions] = useState(
    assignment?.instructions ?? "",
  )
  const [maxScore, setMaxScore] = useState(assignment?.maxScore ?? 100)
  const [dueAt, setDueAt] = useState(toDateTimeLocal(assignment?.dueAt ?? null))
  const [isPublished, setIsPublished] = useState(
    assignment?.isPublished ?? false,
  )
  const [message, setMessage] = useState<string | null>(null)
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
        setMessage("Assignment saved.")
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Assignment could not be saved.",
        )
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
        setMessage("Assignment deleted.")
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Assignment could not be deleted.",
        )
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
        setMessage("Grade saved.")
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Grade could not be saved.",
        )
      }
    })
  }

  return (
    <div className="grid gap-4 border border-border bg-background p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_140px_180px_auto] md:items-end">
        <label className="block text-sm">
          Assignment title
          <input
            className="mt-2 w-full border border-input bg-card px-3 py-2 text-foreground outline-none focus:border-primary"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>
        <label className="block text-sm">
          Max score
          <input
            className="mt-2 w-full border border-input bg-card px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
            min="1"
            onChange={(event) => setMaxScore(Number(event.target.value))}
            type="number"
            value={maxScore}
          />
        </label>
        <label className="block text-sm">
          Due at
          <input
            className="mt-2 w-full border border-input bg-card px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
            onChange={(event) => setDueAt(event.target.value)}
            type="datetime-local"
            value={dueAt}
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

      <label className="block text-sm">
        Instructions
        <textarea
          className="mt-2 min-h-28 w-full border border-input bg-card px-3 py-2 text-foreground outline-none focus:border-primary"
          onChange={(event) => setInstructions(event.target.value)}
          value={instructions}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
          disabled={isPending}
          onClick={saveAssignment}
          type="button"
        >
          {isPending ? "Saving..." : "Save assignment"}
        </button>
        {assignment ? (
          <button
            className="border border-destructive px-4 py-2 text-sm text-destructive"
            disabled={isPending}
            onClick={deleteAssignment}
            type="button"
          >
            Delete assignment
          </button>
        ) : null}
        {message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </div>

      {assignment ? (
        <div className="grid gap-3 border-l border-primary pl-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              Submissions
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {assignment.submissions.length === 0
                ? "No submissions yet."
                : `${assignment.submissions.length} submitted`}
            </p>
          </div>
          {assignment.submissions.map((submission) => (
            <form
              className="grid gap-3 border border-border bg-card p-3 text-sm"
              key={submission.id}
              onSubmit={gradeSubmission}
            >
              <input name="submissionId" type="hidden" value={submission.id} />
              <div>
                <p className="text-foreground">
                  {submission.studentName ?? submission.studentEmail}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {submission.studentEmail} -{" "}
                  {new Date(submission.submittedAt).toLocaleString()}
                </p>
              </div>
              <p className="whitespace-pre-wrap border border-border bg-background p-3 text-muted-foreground">
                {submission.submissionText}
              </p>
              <div className="grid gap-3 md:grid-cols-[120px_1fr_auto]">
                <label className="block">
                  Score
                  <input
                    className="mt-2 w-full border border-input bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
                    defaultValue={submission.gradeScore ?? ""}
                    max={assignment.maxScore}
                    min="0"
                    name="gradeScore"
                    required
                    type="number"
                  />
                </label>
                <label className="block">
                  Feedback
                  <input
                    className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                    defaultValue={submission.gradeFeedback ?? ""}
                    name="gradeFeedback"
                  />
                </label>
                <button
                  className="h-fit self-end border border-primary px-4 py-2 text-sm text-primary disabled:opacity-60"
                  disabled={isPending}
                  type="submit"
                >
                  Save grade
                </button>
              </div>
              {submission.gradedAt ? (
                <p className="font-mono text-xs text-muted-foreground">
                  Graded {new Date(submission.gradedAt).toLocaleString()}
                  {submission.gradedByEmail
                    ? ` by ${submission.gradedByEmail}`
                    : ""}
                </p>
              ) : null}
            </form>
          ))}
        </div>
      ) : null}
    </div>
  )
}
