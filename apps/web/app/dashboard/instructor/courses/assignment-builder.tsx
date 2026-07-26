"use client"

import { type FormEvent, useState, useTransition } from "react"
import type { InstructorAssignmentDto } from "@workspace/types"

import {
  deleteInstructorAssignmentAction,
  gradeAssignmentSubmissionAction,
  saveInstructorAssignmentAction,
} from "./actions"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import { FloatingTextarea } from "@workspace/ui/components/floating-textarea"

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
        <FloatingInput
          label="Assignment title"
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
        <FloatingInput
          className="font-mono text-sm"
          label="Max score"
          min="1"
          onChange={(event) => setMaxScore(Number(event.target.value))}
          type="number"
          value={maxScore}
        />
        <FloatingInput
          className="font-mono text-sm"
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
        label="Instructions"
        onChange={(event) => setInstructions(event.target.value)}
        value={instructions}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={isPending}
          onClick={saveAssignment}
          type="button"
        >
          {isPending ? "Saving..." : "Save assignment"}
        </Button>
        {assignment ? (
          <Button
            disabled={isPending}
            onClick={deleteAssignment}
            type="button"
            variant="destructive"
          >
            Delete assignment
          </Button>
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
                <FloatingInput
                  defaultValue={submission.gradeScore ?? ""}
                  label="Score"
                  max={assignment.maxScore}
                  min="0"
                  name="gradeScore"
                  required
                  type="number"
                />
                <FloatingInput
                  defaultValue={submission.gradeFeedback ?? ""}
                  label="Feedback"
                  name="gradeFeedback"
                />
                <Button
                  className="h-fit self-end"
                  disabled={isPending}
                  type="submit"
                  variant="outline"
                >
                  Save grade
                </Button>
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
