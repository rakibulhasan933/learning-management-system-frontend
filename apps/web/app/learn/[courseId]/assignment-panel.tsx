"use client"

import { useState, useTransition } from "react"
import type {
  StudentAssignmentDto,
  StudentAssignmentSubmissionDto,
} from "@workspace/types"

import { submitAssignmentAction } from "./actions"

interface AssignmentPanelProps {
  assignment: StudentAssignmentDto
}

export function AssignmentPanel({ assignment }: AssignmentPanelProps) {
  const [submissionText, setSubmissionText] = useState(
    assignment.submission?.submissionText ?? "",
  )
  const [submission, setSubmission] =
    useState<StudentAssignmentSubmissionDto | null>(assignment.submission)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const activeSubmission = submission ?? assignment.submission

  function submitAssignment() {
    setMessage(null)
    startTransition(async () => {
      try {
        const result = await submitAssignmentAction({
          assignmentId: assignment.id,
          submissionText,
        })

        setSubmission(result)
        setMessage("Assignment submitted.")
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Assignment could not be submitted.",
        )
      }
    })
  }

  return (
    <div className="grid gap-4 border border-border bg-background p-4">
      <div>
        <p className="font-mono text-xs text-muted-foreground">Assignment</p>
        <h3 className="mt-1 text-xl">{assignment.title}</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {assignment.instructions}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 font-mono text-xs text-muted-foreground">
          <span>{assignment.maxScore} points</span>
          {assignment.dueAt ? (
            <span>Due {new Date(assignment.dueAt).toLocaleString()}</span>
          ) : null}
        </div>
      </div>

      {activeSubmission?.gradeScore !== null &&
      activeSubmission?.gradeScore !== undefined ? (
        <div className="border border-primary p-3 text-sm">
          <p className="font-mono text-primary">
            Score {activeSubmission.gradeScore}/{assignment.maxScore}
          </p>
          {activeSubmission.gradeFeedback ? (
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
              {activeSubmission.gradeFeedback}
            </p>
          ) : null}
        </div>
      ) : activeSubmission ? (
        <p className="border border-border p-3 font-mono text-xs text-muted-foreground">
          Submitted {new Date(activeSubmission.submittedAt).toLocaleString()} -
          waiting for grading
        </p>
      ) : null}

      <label className="block text-sm">
        Submission
        <textarea
          className="mt-2 min-h-32 w-full border border-input bg-card px-3 py-2 text-foreground outline-none focus:border-primary"
          onChange={(event) => setSubmissionText(event.target.value)}
          value={submissionText}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
          disabled={isPending}
          onClick={submitAssignment}
          type="button"
        >
          {isPending
            ? "Submitting..."
            : activeSubmission
              ? "Resubmit assignment"
              : "Submit assignment"}
        </button>
        {message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
