"use client"

import { useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  DollarSign,
  ImageIcon,
  Rocket,
} from "lucide-react"
import type { InstructorCourseDto } from "@workspace/types"

import { ImageUploadControl } from "@/components/image-upload-control"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import { FloatingTextarea } from "@workspace/ui/components/floating-textarea"
import { Label } from "@workspace/ui/components/label"
import { MarkdownEditor } from "@workspace/ui/components/markdown-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { SubmitButton } from "@/components/submit-button"
import { cn } from "@workspace/ui/lib/utils"

interface CourseFormProps {
  action: (formData: FormData) => Promise<void>
  course?: InstructorCourseDto
  submitLabel: string
}

export function CourseForm({ action, course, submitLabel }: CourseFormProps) {
  const [step, setStep] = useState(1)
  const steps = [
    { label: "Basics", note: "Title and description" },
    { label: "Pricing", note: "Category and price" },
    { label: "Media", note: "Course thumbnail" },
    { label: "Publish", note: "Choose course status" },
  ]

  return (
    <form action={action} className="grid gap-4">
      {course ? (
        <input name="courseId" type="hidden" value={course.id} />
      ) : null}

      <div className="grid gap-3 rounded-2xl border border-border bg-card/30 p-3 sm:p-4">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((item, index) => {
            const number = index + 1
            return (
              <button
                className={cn(
                  "rounded-xl border px-2 py-3 text-left transition-colors",
                  step === number
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
                key={item.label}
                onClick={() => setStep(number)}
                type="button"
              >
                <span className="font-mono text-xs text-primary">
                  0{number}
                </span>
                <span className="mt-1 block truncate text-xs font-medium sm:text-sm">
                  {item.label}
                </span>
                <span className="mt-1 hidden truncate text-[11px] text-muted-foreground sm:block">
                  {item.note}
                </span>
              </button>
            )
          })}
        </div>

        <Accordion
          defaultValue={["basics"]}
          multiple
          className="rounded-xl border-border/60 bg-background/40"
        >
          <AccordionItem className={cn(step !== 1 && "hidden")} value="basics">
            <AccordionTrigger className="px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Basics
              </span>
            </AccordionTrigger>
            <AccordionContent keepMounted className="px-3 pb-3">
              <div className="grid gap-3 pt-3">
                <FloatingInput
                  className="h-10 rounded-xl px-3 text-sm"
                  defaultValue={course?.title}
                  label="Title"
                  name="title"
                  required
                />
                <div>
                  <FloatingInput
                    className="h-10 rounded-xl px-3 font-mono text-sm"
                    defaultValue={course?.slug}
                    label="Slug"
                    name="slug"
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    required
                  />
                  <p className="mt-1.5 pl-1 text-xs text-muted-foreground">
                    Lowercase letters, numbers, and hyphens only — e.g.{" "}
                    <span className="font-mono">intro-to-react</span>
                  </p>
                </div>
                <FloatingTextarea
                  className="min-h-20 rounded-xl px-3 pt-4 pb-2 text-sm"
                  defaultValue={course?.shortDescription ?? ""}
                  label="Short description"
                  name="shortDescription"
                />
                <MarkdownEditor
                  defaultValue={course?.description ?? ""}
                  helperText="Write with the toolbar and preview the formatted result beside your text."
                  label="Description"
                  name="description"
                  height={300}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            className={cn(step !== 2 && "hidden")}
            value="classification"
          >
            <AccordionTrigger className="px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                Classification & pricing
              </span>
            </AccordionTrigger>
            <AccordionContent keepMounted className="px-3 pb-3">
              <div className="grid gap-3 pt-3 md:grid-cols-2">
                <FloatingInput
                  className="h-10 rounded-xl px-3 text-sm"
                  defaultValue={course?.category ?? ""}
                  label="Category"
                  name="category"
                />
                <div className="grid gap-2">
                  <Label className="text-sm text-muted-foreground">Level</Label>
                  <Select
                    defaultValue={course?.level ?? "all_levels"}
                    name="level"
                  >
                    <SelectTrigger
                      className="h-9 w-full rounded-xl border-border bg-input/20 text-sm"
                      size="sm"
                    >
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="all_levels">All levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <FloatingInput
                  className="h-10 rounded-xl px-3 font-mono text-sm"
                  defaultValue={course?.price ?? "0"}
                  label="Price"
                  min="0"
                  name="price"
                  step="0.01"
                  type="number"
                  required
                />
                <FloatingInput
                  className="h-10 rounded-xl px-3 font-mono text-sm uppercase"
                  defaultValue={course?.currency ?? "BDT"}
                  label="Currency"
                  maxLength={3}
                  minLength={3}
                  name="currency"
                  required
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem className={cn(step !== 3 && "hidden")} value="media">
            <AccordionTrigger className="px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                Media
              </span>
            </AccordionTrigger>
            <AccordionContent keepMounted className="px-3 pb-3">
              <div className="grid gap-3 pt-3">
                <ImageUploadControl
                  buttonLabel="Upload thumbnail"
                  currentUrl={course?.thumbnailUrl ?? null}
                  helpText="Shown on the course card and detail page. Landscape images crop best."
                  inputName="thumbnailUrl"
                  label="Course thumbnail"
                  purpose="course_thumbnail"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            className={cn(step !== 4 && "hidden")}
            value="publishing"
          >
            <AccordionTrigger className="px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2">
                <Rocket className="h-3.5 w-3.5 text-primary" />
                Publishing
              </span>
            </AccordionTrigger>
            <AccordionContent keepMounted className="px-3 pb-3">
              <div className="grid gap-3 pt-3 md:max-w-xs">
                <Label className="text-sm text-muted-foreground">Status</Label>
                <Select defaultValue={course?.status ?? "draft"} name="status">
                  <SelectTrigger
                    className="h-9 w-full rounded-xl border-border bg-input/20 text-sm"
                    size="sm"
                  >
                    <SelectValue placeholder="Draft" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_review">
                      Pending review
                    </SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            disabled={step === 1}
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            type="button"
          >
            <ArrowLeft className="size-4" />
            Previous
          </button>
          {step < steps.length ? (
            <button
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm text-primary-foreground transition-opacity hover:opacity-85"
              onClick={() =>
                setStep((current) => Math.min(steps.length, current + 1))
              }
              type="button"
            >
              Next
              <ArrowRight className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <SubmitButton
        className="w-full sm:w-fit sm:px-8"
        pendingLabel={`${submitLabel}...`}
      >
        {submitLabel}
      </SubmitButton>
    </form>
  )
}
