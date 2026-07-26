import type { InstructorCourseDto } from "@workspace/types"

import { ImageUploadControl } from "@/components/image-upload-control"
import { Button } from "@workspace/ui/components/button"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import { FloatingTextarea } from "@workspace/ui/components/floating-textarea"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

interface CourseFormProps {
  action: (formData: FormData) => Promise<void>
  course?: InstructorCourseDto
  submitLabel: string
}

export function CourseForm({ action, course, submitLabel }: CourseFormProps) {
  return (
    <form
      action={action}
      className="grid gap-8 border border-border bg-card p-5 sm:p-6"
    >
      {course ? (
        <input name="courseId" type="hidden" value={course.id} />
      ) : null}

      {/* Basics */}
      <div className="grid gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Basics
        </p>
        <FloatingInput
          defaultValue={course?.title}
          label="Title"
          name="title"
          required
        />
        <FloatingInput
          className="font-mono text-sm"
          defaultValue={course?.slug}
          label="Slug"
          name="slug"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
        />
        <FloatingTextarea
          defaultValue={course?.shortDescription ?? ""}
          label="Short description"
          name="shortDescription"
        />
        <FloatingTextarea
          defaultValue={course?.description ?? ""}
          label="Description"
          name="description"
        />
      </div>

      <Separator />

      {/* Classification & pricing */}
      <div className="grid gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Classification & pricing
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <FloatingInput
            defaultValue={course?.category ?? ""}
            label="Category"
            name="category"
          />
          <div className="grid gap-2">
            <Label className="text-sm text-muted-foreground">Level</Label>
            <Select defaultValue={course?.level ?? "all_levels"} name="level">
              <SelectTrigger className="w-full">
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
            className="font-mono"
            defaultValue={course?.price ?? "0"}
            label="Price"
            min="0"
            name="price"
            step="0.01"
            type="number"
            required
          />
          <FloatingInput
            className="font-mono"
            defaultValue={course?.currency ?? "BDT"}
            label="Currency"
            maxLength={3}
            minLength={3}
            name="currency"
            required
          />
        </div>
      </div>

      <Separator />

      {/* Media */}
      <div className="grid gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Media
        </p>
        <ImageUploadControl
          buttonLabel="Upload thumbnail"
          currentUrl={course?.thumbnailUrl ?? null}
          helpText="Shown on the course card and detail page. Landscape images crop best."
          inputName="thumbnailUrl"
          label="Course thumbnail"
          purpose="course_thumbnail"
        />
      </div>

      <Separator />

      {/* Publishing */}
      <div className="grid gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Publishing
        </p>
        <div className="grid gap-2 md:max-w-xs">
          <Label className="text-sm text-muted-foreground">Status</Label>
          <Select defaultValue={course?.status ?? "draft"} name="status">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Draft" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_review">Pending review</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button className="w-full sm:w-fit" type="submit">
        {submitLabel}
      </Button>
    </form>
  )
}