"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import type {
  StudentAssignmentDto,
  StudentAssignmentSubmissionDto,
} from "@workspace/types"

import { submitAssignmentAction } from "./actions"
import { Button } from "@workspace/ui/components/button"
import { FloatingTextarea } from "@workspace/ui/components/floating-textarea"

interface AssignmentPanelProps {
  assignment: StudentAssignmentDto
}

export function AssignmentPanel({ assignment }: AssignmentPanelProps) {
  const [submissionText, setSubmissionText] = useState(
    assignment.submission?.submissionText ?? ""
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
            : "Assignment could not be submitted."
        )
      }
    })
  }

  return (
    <div className="grid gap-4 rounded-2xl bg-background p-4 ring-1 ring-foreground/10">
      <div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground">
          Assignment
        </p>
        <h3 className="mt-1 font-heading text-xl tracking-tight">
          {assignment.title}
        </h3>
        <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
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
        <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-3 text-sm">
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
        <p className="rounded-xl p-3 font-mono text-xs text-muted-foreground ring-1 ring-foreground/10">
          Submitted {new Date(activeSubmission.submittedAt).toLocaleString()} -
          waiting for grading
        </p>
      ) : null}

      <FloatingTextarea
        label="Submission"
        onChange={(event) => setSubmissionText(event.target.value)}
        value={submissionText}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={isPending} onClick={submitAssignment} type="button">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {isPending
            ? "Submitting..."
            : activeSubmission
              ? "Resubmit assignment"
              : "Submit assignment"}
        </Button>
        {message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
