import type { InstructorCourseDto } from "@workspace/types"

import { ImageUploadControl } from "@/components/image-upload-control"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Button } from "@workspace/ui/components/button"
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

interface CourseFormProps {
  action: (formData: FormData) => Promise<void>
  course?: InstructorCourseDto
  submitLabel: string
}

export function CourseForm({ action, course, submitLabel }: CourseFormProps) {
  return (
    <form action={action} className="grid gap-4">
      {course ? (
        <input name="courseId" type="hidden" value={course.id} />
      ) : null}

      <Accordion
        defaultValue={["basics"]}
        multiple
        className="border-border/60 bg-background/40"
      >
        <AccordionItem value="basics">
          <AccordionTrigger className="px-3 py-2.5 text-sm">
            Basics
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
              <FloatingInput
                className="h-10 rounded-xl px-3 font-mono text-sm"
                defaultValue={course?.slug}
                label="Slug"
                name="slug"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                required
              />
              <FloatingTextarea
                className="min-h-20 rounded-xl px-3 pb-2 pt-4 text-sm"
                defaultValue={course?.shortDescription ?? ""}
                label="Short description"
                name="shortDescription"
              />
              <MarkdownEditor
                defaultValue={course?.description ?? ""}
                helperText="Write the long-form course description in markdown."
                label="Description"
                name="description"
                height={220}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="classification">
          <AccordionTrigger className="px-3 py-2.5 text-sm">
            Classification & pricing
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
                <Select defaultValue={course?.level ?? "all_levels"} name="level">
                  <SelectTrigger className="h-9 w-full rounded-xl border-border bg-input/20 text-sm" size="sm">
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
                className="h-10 rounded-xl px-3 font-mono text-sm"
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

        <AccordionItem value="media">
          <AccordionTrigger className="px-3 py-2.5 text-sm">
            Media
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

        <AccordionItem value="publishing">
          <AccordionTrigger className="px-3 py-2.5 text-sm">
            Publishing
          </AccordionTrigger>
          <AccordionContent keepMounted className="px-3 pb-3">
            <div className="grid gap-3 pt-3 md:max-w-xs">
              <Label className="text-sm text-muted-foreground">Status</Label>
              <Select defaultValue={course?.status ?? "draft"} name="status">
                <SelectTrigger className="h-9 w-full rounded-xl border-border bg-input/20 text-sm" size="sm">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button className="w-full sm:w-fit" size="sm" type="submit">
        {submitLabel}
      </Button>
    </form>
  )
}
