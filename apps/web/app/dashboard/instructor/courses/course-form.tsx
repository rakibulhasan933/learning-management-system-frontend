import type { InstructorCourseDto } from "@workspace/types"

import { ImageUploadControl } from "@/components/image-upload-control"

interface CourseFormProps {
  action: (formData: FormData) => Promise<void>
  course?: InstructorCourseDto
  submitLabel: string
}

export function CourseForm({ action, course, submitLabel }: CourseFormProps) {
  return (
    <form action={action} className="grid gap-5 border border-border bg-card p-5">
      {course ? <input name="courseId" type="hidden" value={course.id} /> : null}
      <label className="block text-sm">
        Title
        <input
          className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
          name="title"
          required
          defaultValue={course?.title}
        />
      </label>
      <label className="block text-sm">
        Slug
        <input
          className="mt-2 w-full border border-input bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
          name="slug"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
          defaultValue={course?.slug}
        />
      </label>
      <label className="block text-sm">
        Short description
        <textarea
          className="mt-2 min-h-24 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
          name="shortDescription"
          defaultValue={course?.shortDescription ?? ""}
        />
      </label>
      <label className="block text-sm">
        Description
        <textarea
          className="mt-2 min-h-40 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
          name="description"
          defaultValue={course?.description ?? ""}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          Category
          <input
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
            name="category"
            defaultValue={course?.category ?? ""}
          />
        </label>
        <label className="block text-sm">
          Level
          <select
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
            name="level"
            defaultValue={course?.level ?? "all_levels"}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="all_levels">All levels</option>
          </select>
        </label>
        <label className="block text-sm">
          Price
          <input
            className="mt-2 w-full border border-input bg-background px-3 py-2 font-mono text-foreground outline-none focus:border-primary"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={course?.price ?? "0"}
          />
        </label>
        <label className="block text-sm">
          Currency
          <input
            className="mt-2 w-full border border-input bg-background px-3 py-2 font-mono text-foreground outline-none focus:border-primary"
            name="currency"
            maxLength={3}
            minLength={3}
            required
            defaultValue={course?.currency ?? "BDT"}
          />
        </label>
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
        <label className="block text-sm">
          Status
          <select
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
            name="status"
            defaultValue={course?.status ?? "draft"}
          >
            <option value="draft">Draft</option>
            <option value="pending_review">Pending review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>
      <button
        className="w-fit bg-primary px-5 py-3 text-sm text-primary-foreground"
        type="submit"
      >
        {submitLabel}
      </button>
    </form>
  )
}
