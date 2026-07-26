import type { InstructorCourseDto } from "@workspace/types"

import { ImageUploadControl } from "@/components/image-upload-control"
import { Button } from "@workspace/ui/components/button"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import { FloatingTextarea } from "@workspace/ui/components/floating-textarea"
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
    <form action={action} className="grid gap-5 border border-border bg-card p-5">
      {course ? <input name="courseId" type="hidden" value={course.id} /> : null}
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
      <div className="grid gap-4 md:grid-cols-2">
        <FloatingInput
          defaultValue={course?.category ?? ""}
          label="Category"
          name="category"
        />
        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">Level</p>
          <Select defaultValue={course?.level ?? "all_levels"} name="level">
            <SelectTrigger className="w-full rounded-2xl border-border bg-input/20">
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
        <div className="md:col-span-2">
          <ImageUploadControl
            buttonLabel="Upload thumbnail"
            currentUrl={course?.thumbnailUrl ?? null}
            helpText="Upload a JPG, PNG, or WEBP image up to 4 MB. The uploaded file is saved as the course thumbnail URL."
            inputName="thumbnailUrl"
            label="Course thumbnail"
            purpose="course_thumbnail"
          />
        </div>
        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">Status</p>
          <Select defaultValue={course?.status ?? "draft"} name="status">
            <SelectTrigger className="w-full rounded-2xl border-border bg-input/20">
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
      <Button className="w-fit" type="submit">
        {submitLabel}
      </Button>
    </form>
  )
}
