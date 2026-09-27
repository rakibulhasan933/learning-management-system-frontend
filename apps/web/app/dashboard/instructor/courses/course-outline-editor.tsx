"use client"

import { useEffect, useRef, useState } from "react"
import type { InstructorCourseOutlineResponse } from "@workspace/types"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@workspace/ui/components/accordion"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import { MarkdownEditor } from "@workspace/ui/components/markdown-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { AssignmentBuilder } from "./assignment-builder"
import {
  createInstructorLectureAction,
  createInstructorSectionAction,
  deleteInstructorLectureAction,
  deleteInstructorSectionAction,
  updateInstructorLectureAction,
  updateInstructorSectionAction,
} from "./actions"
import { MaterialUploadControl } from "./material-upload-control"
import { QuizBuilder } from "./quiz-builder"
import { VideoUploadControl } from "./video-upload-control"

import { SubmitButton } from "@/components/submit-button"

interface CourseOutlineEditorProps {
  courseId: string
  outline: InstructorCourseOutlineResponse
}

type SectionDto = InstructorCourseOutlineResponse["sections"][number]
type LectureDto = SectionDto["lectures"][number]

type StatusTone = "accent" | "muted" | "success"

const chipClasses: Record<StatusTone, string> = {
  accent: "border-primary/40 bg-primary/10 text-primary",
  muted: "border-border bg-muted/40 text-muted-foreground",
  success: "border-secondary/40 bg-secondary/10 text-secondary-foreground",
}

const compactInputClass = "h-10 rounded-xl px-3 text-sm"
const compactMonoInputClass = "h-10 rounded-xl px-3 font-mono text-sm"
const compactSelectTriggerClass =
  "h-9 w-full rounded-xl border-border bg-input/20 text-sm"

function toDateTimeLocal(value: string | null) {
  return value ? value.slice(0, 16) : ""
}

function getNextPosition(items: Array<{ position: number }>) {
  return items.length > 0
    ? Math.max(...items.map((item) => item.position)) + 1
    : 0
}

function formatDurationLabel(durationSeconds: number | null) {
  if (durationSeconds === null || Number.isNaN(durationSeconds)) {
    return "duration unset"
  }

  const totalSeconds = Math.max(0, Math.round(durationSeconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours}h`)
  }

  if (minutes > 0 || hours > 0) {
    parts.push(`${minutes}m`)
  }

  parts.push(`${seconds}s`)

  return parts.join(" ")
}

function formatDripLabel(dripAfterDays: number) {
  if (dripAfterDays <= 0) {
    return "drip now"
  }

  return `drip after ${dripAfterDays} day${dripAfterDays === 1 ? "" : "s"}`
}

function StatusChip({
  children,
  tone = "muted",
}: {
  children: string
  tone?: StatusTone
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium tracking-wide ${chipClasses[tone]}`}
    >
      {children}
    </span>
  )
}

function ConfirmDeleteButton({
  label = "Delete",
  confirmLabel = "Confirm delete",
  size = "sm",
}: {
  label?: string
  confirmLabel?: string
  size?: "sm" | "default"
}) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <SubmitButton pendingLabel="Deleting..." size={size} variant="destructive">
          {confirmLabel}
        </SubmitButton>
        <Button
          onClick={() => setConfirming(false)}
          size={size}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => setConfirming(true)}
      size={size}
      type="button"
      variant="destructive"
    >
      {label}
    </Button>
  )
}

function LectureAccordionItem({
  courseId,
  lecture,
  onOpenLecture,
}: {
  courseId: string
  lecture: LectureDto
  onOpenLecture: (lectureId: string) => void
}) {
  const [moduleStep, setModuleStep] = useState<
    "basic" | "video" | "materials" | "quiz" | "assignment"
  >("basic")

  return (
    <AccordionItem
      className="border-border/80 data-open:bg-background/40"
      value={lecture.id}
    >
      <div className="grid gap-2 border-b border-border/70 px-3 py-2.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <AccordionTrigger className="min-w-0 w-full justify-start rounded-none p-0 text-left hover:bg-transparent">
          <div className="grid min-w-0 gap-1.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h4 className="min-w-0 truncate font-heading text-sm font-medium tracking-tight md:text-base">
                {lecture.title}
              </h4>
              <span className="font-mono text-xs text-muted-foreground">
                {formatDurationLabel(lecture.durationSeconds ?? null)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusChip tone={lecture.isPublished ? "success" : "muted"}>
                {lecture.isPublished ? "published" : "draft"}
              </StatusChip>
              <StatusChip tone={lecture.isPreview ? "accent" : "muted"}>
                {lecture.isPreview ? "preview" : "private"}
              </StatusChip>
            </div>
          </div>
        </AccordionTrigger>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Button
            onClick={() => onOpenLecture(lecture.id)}
            type="button"
            size="sm"
            variant="outline"
          >
            Edit
          </Button>
          <form action={deleteInstructorLectureAction}>
            <input name="courseId" type="hidden" value={courseId} />
            <input name="lectureId" type="hidden" value={lecture.id} />
            <ConfirmDeleteButton />
          </form>
        </div>
      </div>

      <AccordionContent keepMounted className="px-3 pb-3">
        <div className="grid gap-3 pt-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {([
              ["basic", "Basic info"],
              ["video", "Video"],
              ["materials", "PDF / slides"],
              ["quiz", "Quiz"],
              ["assignment", "Assignment"],
            ] as const).map(([value, label], index) => (
              <button
                className={`rounded-xl border px-2 py-2 text-left text-xs transition-colors ${
                  moduleStep === value
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
                key={value}
                onClick={() => setModuleStep(value)}
                type="button"
              >
                <span className="block font-mono text-[10px] text-primary">0{index + 1}</span>
                <span className="mt-1 block truncate">{label}</span>
              </button>
            ))}
          </div>

          <form
            action={updateInstructorLectureAction}
            className="grid gap-3 rounded-2xl border border-border/60 bg-background/40 p-3 md:grid-cols-4"
          >
            <input name="courseId" type="hidden" value={courseId} />
            <input name="lectureId" type="hidden" value={lecture.id} />
            <div className={moduleStep === "basic" ? "contents" : "hidden"}>
              <FloatingInput
                className={`${compactInputClass} md:col-span-2`}
                defaultValue={lecture.title}
                label="Module title"
                name="title"
                required
              />
              <FloatingInput
                className={compactMonoInputClass}
                defaultValue={lecture.position}
                label="Position"
                min="0"
                name="position"
                required
                type="number"
              />
              <FloatingInput
                className={compactMonoInputClass}
                defaultValue={lecture.durationSeconds ?? ""}
                label="Duration"
                min="0"
                name="durationSeconds"
                placeholder="seconds"
                type="number"
              />
            </div>
            <div className={moduleStep === "video" ? "contents" : "hidden"}>
              <FloatingInput
                className={`${compactMonoInputClass} md:col-span-2`}
                defaultValue={lecture.videoRef ?? ""}
                label="Video reference"
                name="videoRef"
                placeholder="r2/object-key.mp4"
              />
              <VideoUploadControl courseId={courseId} lectureId={lecture.id} />
              <div className="grid gap-2">
                <p className="text-sm text-muted-foreground">Video provider</p>
                <Select defaultValue={lecture.videoProvider} name="videoProvider">
                  <SelectTrigger className={compactSelectTriggerClass} size="sm">
                    <SelectValue placeholder="R2" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="r2">R2</SelectItem>
                    <SelectItem value="bunny">Bunny</SelectItem>
                    <SelectItem value="cloudflare_stream">Cloudflare Stream</SelectItem>
                    <SelectItem value="mux">Mux</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className={moduleStep === "materials" ? "grid gap-3 md:col-span-4 md:grid-cols-2" : "hidden"}>
              <MaterialUploadControl
                courseId={courseId}
                kind="pdf"
                lectureId={lecture.id}
                url={lecture.pdfUrl}
              />
              <MaterialUploadControl
                courseId={courseId}
                kind="slides"
                lectureId={lecture.id}
                url={lecture.slidesUrl}
              />
            </div>
            <div className={moduleStep === "quiz" ? "md:col-span-4" : "hidden"}>
              <QuizBuilder
                courseId={courseId}
                quiz={lecture.quiz}
                targetId={lecture.id}
                targetLabel={lecture.title}
                targetType="lecture"
              />
            </div>
            <div className={moduleStep === "basic" ? "contents" : "hidden"}>
              <FloatingInput
                className={compactMonoInputClass}
                defaultValue={toDateTimeLocal(lecture.availableAt)}
                label="Available at"
                name="availableAt"
                type="datetime-local"
              />
              <MarkdownEditor
                className="md:col-span-4"
                defaultValue={lecture.description ?? ""}
                helperText="Markdown is supported here."
                label="Module description"
                name="description"
                height={200}
              />
            <div className="flex flex-wrap gap-4 text-sm md:col-span-3">
              <label className="flex items-center gap-2 text-muted-foreground">
                <Checkbox defaultChecked={lecture.isPreview} name="isPreview" />
                Free preview
              </label>
              <label className="flex items-center gap-2 text-muted-foreground">
                <Checkbox defaultChecked={lecture.isPublished} name="isPublished" />
                Published
              </label>
            </div>
            </div>
            <div className="flex gap-3">
              <SubmitButton pendingLabel="Saving..." size="sm">
                Save
              </SubmitButton>
            </div>
          </form>

          <div className={moduleStep === "assignment" ? "grid gap-3 rounded-2xl border border-border/60 bg-background/40 p-3" : "hidden"}>
            <h5 className="font-heading text-sm font-medium tracking-tight md:text-base">
              Module assignment
            </h5>
            <AssignmentBuilder
              assignment={lecture.assignment}
              courseId={courseId}
              targetId={lecture.id}
              targetLabel={lecture.title}
              targetType="lecture"
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

function SectionAccordionItem({
  courseId,
  onOpenSection,
  section,
}: {
  courseId: string
  onOpenSection: (sectionId: string) => void
  section: SectionDto
}) {
  const [openLectures, setOpenLectures] = useState<string[]>([])
  const previousLectureIdsRef = useRef<string[] | null>(null)

  useEffect(() => {
    const currentLectureIds = section.lectures.map((lecture) => lecture.id)
    const previousLectureIds = previousLectureIdsRef.current

    previousLectureIdsRef.current = currentLectureIds

    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) {
        return
      }

      setOpenLectures((current) =>
        current.filter((lectureId) => currentLectureIds.includes(lectureId)),
      )

      if (previousLectureIds && currentLectureIds.length > previousLectureIds.length) {
        const previousLectureIdSet = new Set(previousLectureIds)
        const nextLecture = section.lectures.find(
          (lecture) => !previousLectureIdSet.has(lecture.id),
        )

        if (nextLecture) {
          setOpenLectures((current) =>
            current.includes(nextLecture.id)
              ? current
              : [...current, nextLecture.id],
          )
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [section.lectures])

  return (
    <AccordionItem
      className="border-border/80 data-open:bg-background/40"
      value={section.id}
    >
      <div className="grid gap-2 border-b border-border/70 px-3 py-2.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <AccordionTrigger className="min-w-0 w-full justify-start rounded-none p-0 text-left hover:bg-transparent">
          <div className="grid min-w-0 gap-1.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="min-w-0 truncate font-heading text-base font-medium tracking-tight md:text-lg">
                {section.title}
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                {section.lectures.length} module
                {section.lectures.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusChip tone={section.dripAfterDays > 0 ? "accent" : "success"}>
                {formatDripLabel(section.dripAfterDays)}
              </StatusChip>
            </div>
          </div>
        </AccordionTrigger>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Button
            onClick={() => onOpenSection(section.id)}
            type="button"
            size="sm"
            variant="outline"
          >
            Edit
          </Button>
          <form action={deleteInstructorSectionAction}>
            <input name="courseId" type="hidden" value={courseId} />
            <input name="sectionId" type="hidden" value={section.id} />
            <ConfirmDeleteButton />
          </form>
        </div>
      </div>

      <AccordionContent keepMounted className="px-3 pb-3">
        <div className="grid gap-4 pt-3">
          <form
            action={updateInstructorSectionAction}
            className="grid gap-3 rounded-2xl border border-border/60 bg-background/40 p-3 md:grid-cols-[1fr_120px_120px]"
          >
            <input name="courseId" type="hidden" value={courseId} />
            <input name="sectionId" type="hidden" value={section.id} />
            <FloatingInput
              className={compactInputClass}
              defaultValue={section.title}
              label="Milestone title"
              name="title"
              required
            />
            <FloatingInput
              className={compactMonoInputClass}
              defaultValue={section.dripAfterDays}
              label="Drip days"
              min="0"
              name="dripAfterDays"
              required
              type="number"
            />
            <FloatingInput
              className={compactMonoInputClass}
              defaultValue={section.position}
              label="Position"
              min="0"
              name="position"
              required
              type="number"
            />
            <MarkdownEditor
              className="md:col-span-3"
              defaultValue={section.description ?? ""}
              helperText="Markdown is supported here."
              label="Description"
              name="description"
              height={200}
            />
            <SubmitButton
              className="w-fit md:col-span-3"
              pendingLabel="Saving milestone..."
              size="sm"
              variant="secondary"
            >
              Save milestone
            </SubmitButton>
          </form>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-heading text-sm tracking-tight md:text-base">
                Modules
              </h4>
              <span className="font-mono text-xs text-muted-foreground">
                {section.lectures.length} total modules
              </span>
            </div>

            <Accordion
              multiple
              value={openLectures}
              onValueChange={setOpenLectures}
              className="border-border/60 bg-background/40"
            >
              {section.lectures.map((lecture) => (
                <LectureAccordionItem
                  courseId={courseId}
                  key={lecture.id}
                  lecture={lecture}
                  onOpenLecture={(lectureId) =>
                    setOpenLectures((current) =>
                      current.includes(lectureId) ? current : [...current, lectureId],
                    )
                  }
                />
              ))}
            </Accordion>
          </div>

          <form
            action={createInstructorLectureAction}
            className="grid gap-3 rounded-2xl border border-dashed border-border/60 bg-background/30 p-3 md:grid-cols-4"
          >
            <input name="courseId" type="hidden" value={courseId} />
            <input name="sectionId" type="hidden" value={section.id} />
            <FloatingInput
              className={`${compactInputClass} md:col-span-2`}
              label="New module"
              name="title"
              required
            />
            <FloatingInput
              className={compactMonoInputClass}
              defaultValue={getNextPosition(section.lectures)}
              label="Position"
              min="0"
              name="position"
              required
              type="number"
            />
            <FloatingInput
              className={compactMonoInputClass}
              label="Duration"
              min="0"
              name="durationSeconds"
              placeholder="seconds"
              type="number"
            />
            <FloatingInput
              className={`${compactMonoInputClass} md:col-span-2`}
              label="Video reference"
              name="videoRef"
              placeholder="r2/object-key.mp4"
            />
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">Provider</p>
              <Select defaultValue="r2" name="videoProvider">
                <SelectTrigger className={compactSelectTriggerClass} size="sm">
                  <SelectValue placeholder="R2" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="r2">R2</SelectItem>
                  <SelectItem value="bunny">Bunny</SelectItem>
                  <SelectItem value="cloudflare_stream">
                    Cloudflare Stream
                  </SelectItem>
                  <SelectItem value="mux">Mux</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FloatingInput
              className={compactMonoInputClass}
              label="Available at"
              name="availableAt"
              type="datetime-local"
            />
            <MarkdownEditor
              className="md:col-span-4"
              helperText="Markdown is supported here."
              label="Description"
              name="description"
              height={200}
            />
            <div className="flex flex-wrap gap-4 text-sm md:col-span-3">
              <label className="flex items-center gap-2 text-muted-foreground">
                <Checkbox name="isPreview" />
                Free preview
              </label>
              <label className="flex items-center gap-2 text-muted-foreground">
                <Checkbox name="isPublished" />
                Published
              </label>
            </div>
            <SubmitButton className="w-fit" pendingLabel="Adding module..." size="sm">
              Add module
            </SubmitButton>
          </form>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export function CourseOutlineEditor({
  courseId,
  outline,
}: CourseOutlineEditorProps) {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0)
  const activeSection = outline.sections[activeSectionIndex]

  return (
    <section className="grid gap-4">
      <div>
        <div className="h-px w-20 bg-primary" />
        <h2 className="mt-4 font-heading text-2xl tracking-tight">
          Course outline
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Build the course as milestones. Each milestone contains modules, and
          each module can have a video, quiz, assignment, and materials.
        </p>
      </div>

      <form
        action={createInstructorSectionAction}
        className="grid gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 md:grid-cols-[1fr_140px_160px]"
      >
        <input name="courseId" type="hidden" value={courseId} />
        <FloatingInput
          className={compactInputClass}
          label="Milestone title"
          name="title"
          required
        />
        <FloatingInput
          className={compactMonoInputClass}
          defaultValue="0"
          label="Drip days"
          min="0"
          name="dripAfterDays"
          required
          type="number"
        />
        <FloatingInput
          className={compactMonoInputClass}
          defaultValue={getNextPosition(outline.sections)}
          label="Position"
          min="0"
          name="position"
          required
          type="number"
        />
        <MarkdownEditor
          className="md:col-span-3"
          helperText="Markdown is supported here."
          label="Description"
          name="description"
          height={200}
        />
        <SubmitButton
          className="w-fit md:col-span-3"
          pendingLabel="Adding milestone..."
          size="sm"
        >
          Add milestone
        </SubmitButton>
      </form>

      {outline.sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No milestones yet. Add the first milestone to start building modules.
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {outline.sections.map((section, index) => (
              <button
                className={`rounded-2xl border p-3 text-left transition-colors ${
                  index === activeSectionIndex
                    ? "border-primary/60 bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
                key={section.id}
                onClick={() => setActiveSectionIndex(index)}
                type="button"
              >
                <span className="font-mono text-[10px] text-primary">
                  Milestone {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-1 block truncate text-sm font-medium">
                  {section.title}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {section.lectures.length} module{section.lectures.length === 1 ? "" : "s"}
                </span>
              </button>
            ))}
          </div>

          {activeSection ? (
            <>
              <Accordion
                multiple
                defaultValue={[activeSection.id]}
                className="border-border/60 bg-card/80"
              >
                <SectionAccordionItem
                  courseId={courseId}
                  key={activeSection.id}
                  onOpenSection={() => undefined}
                  section={activeSection}
                />
              </Accordion>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <Button
                  disabled={activeSectionIndex === 0}
                  onClick={() => setActiveSectionIndex((current) => Math.max(0, current - 1))}
                  type="button"
                  variant="outline"
                >
                  Previous milestone
                </Button>
                <span className="font-mono text-xs text-muted-foreground">
                  {activeSectionIndex + 1} / {outline.sections.length}
                </span>
                <Button
                  disabled={activeSectionIndex === outline.sections.length - 1}
                  onClick={() =>
                    setActiveSectionIndex((current) =>
                      Math.min(outline.sections.length - 1, current + 1),
                    )
                  }
                  type="button"
                >
                  Next milestone
                </Button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </section>
  )
}
