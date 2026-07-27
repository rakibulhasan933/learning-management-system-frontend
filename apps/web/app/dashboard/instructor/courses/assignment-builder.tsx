"use client"

import { type FormEvent, useState, useTransition } from "react"
import type { InstructorAssignmentDto } from "@workspace/types"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
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
        className="min-h-20 rounded-xl px-3 pb-2 pt-4 text-sm"
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
          {isPending ? "Saving..." : "Save assignment"}
        </Button>
        {assignment ? (
          <Button
            className="w-full sm:w-auto"
            disabled={isPending}
            onClick={deleteAssignment}
            size="sm"
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
                          <p className="whitespace-pre-wrap border border-border bg-background p-3 text-muted-foreground">
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
                              className="w-full h-fit self-end sm:w-auto"
                              disabled={isPending}
                              size="sm"
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
