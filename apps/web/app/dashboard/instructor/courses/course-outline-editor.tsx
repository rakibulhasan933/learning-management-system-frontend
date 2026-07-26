import { Fragment } from "react"
import type { InstructorCourseOutlineResponse } from "@workspace/types"

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
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import { FloatingTextarea } from "@workspace/ui/components/floating-textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

interface CourseOutlineEditorProps {
  courseId: string
  outline: InstructorCourseOutlineResponse
}

function toDateTimeLocal(value: string | null) {
  return value ? value.slice(0, 16) : ""
}

function getNextPosition(items: Array<{ position: number }>) {
  return items.length > 0
    ? Math.max(...items.map((item) => item.position)) + 1
    : 0
}

export function CourseOutlineEditor({
  courseId,
  outline,
}: CourseOutlineEditorProps) {
  const nextSectionPosition = getNextPosition(outline.sections)

  return (
    <section className="grid gap-5">
      <div>
        <div className="h-px w-20 bg-primary" />
        <h2 className="mt-4 text-2xl tracking-tight">Course outline</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Build the course structure students will move through: sections,
          lecture order, preview access, publication state, and drip scheduling.
        </p>
      </div>

      <form
        action={createInstructorSectionAction}
        className="grid gap-4 border border-border bg-card p-5 md:grid-cols-[1fr_140px_160px_auto]"
      >
        <input name="courseId" type="hidden" value={courseId} />
        <FloatingInput label="Section title" name="title" required />
        <FloatingInput
          className="font-mono text-sm"
          defaultValue="0"
          label="Drip days"
          min="0"
          name="dripAfterDays"
          required
          type="number"
        />
        <FloatingInput
          className="font-mono text-sm"
          defaultValue={nextSectionPosition}
          label="Position"
          min="0"
          name="position"
          required
          type="number"
        />
        <FloatingTextarea
          className="md:col-span-3"
          label="Description"
          name="description"
        />
        <Button className="h-fit self-end" type="submit">
          Add section
        </Button>
      </form>

      {outline.sections.length === 0 ? (
        <div className="border border-dashed border-border p-6 text-sm text-muted-foreground">
          No sections yet. Add the first section to start building lectures.
        </div>
      ) : (
        <div className="grid gap-5">
          {outline.sections.map((section) => {
            const nextLecturePosition = getNextPosition(section.lectures)

            return (
              <article
                className="grid gap-5 border border-border bg-card p-5"
                key={section.id}
              >
                <div className="grid gap-4 md:grid-cols-[1fr_120px_120px_auto]">
                  <form
                    action={updateInstructorSectionAction}
                    className="grid gap-4 md:col-span-3 md:grid-cols-[1fr_120px_120px]"
                  >
                    <input name="courseId" type="hidden" value={courseId} />
                    <input name="sectionId" type="hidden" value={section.id} />
                    <FloatingInput
                      defaultValue={section.title}
                      label="Section title"
                      name="title"
                      required
                    />
                    <FloatingInput
                      className="font-mono text-sm"
                      defaultValue={section.dripAfterDays}
                      label="Drip days"
                      min="0"
                      name="dripAfterDays"
                      required
                      type="number"
                    />
                    <FloatingInput
                      className="font-mono text-sm"
                      defaultValue={section.position}
                      label="Position"
                      min="0"
                      name="position"
                      required
                      type="number"
                    />
                    <FloatingTextarea
                      className="md:col-span-3"
                      defaultValue={section.description ?? ""}
                      label="Description"
                      name="description"
                    />
                    <Button className="w-fit" type="submit" variant="secondary">
                      Save section
                    </Button>
                  </form>
                  <form action={deleteInstructorSectionAction}>
                    <input name="courseId" type="hidden" value={courseId} />
                    <input name="sectionId" type="hidden" value={section.id} />
                    <Button
                      className="mt-7"
                      type="submit"
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  </form>
                </div>

                <div className="grid gap-3">
                  <h3 className="text-lg tracking-tight">Section quiz</h3>
                  <QuizBuilder
                    courseId={courseId}
                    quiz={section.quiz}
                    targetId={section.id}
                    targetLabel={section.title}
                    targetType="section"
                  />
                </div>

                <div className="grid gap-3">
                  <h3 className="text-lg tracking-tight">Section assignment</h3>
                  <AssignmentBuilder
                    assignment={section.assignment}
                    courseId={courseId}
                    targetId={section.id}
                    targetLabel={section.title}
                    targetType="section"
                  />
                </div>

                <div className="border-l border-primary pl-4">
                  <h3 className="text-lg tracking-tight">Lectures</h3>
                  <div className="mt-4 grid gap-4">
                    {section.lectures.map((lecture) => (
                      <Fragment key={lecture.id}>
                        <form
                          action={updateInstructorLectureAction}
                          className="grid gap-4 border border-border bg-background p-4 md:grid-cols-4"
                        >
                          <input name="courseId" type="hidden" value={courseId} />
                          <input
                            name="lectureId"
                            type="hidden"
                            value={lecture.id}
                          />
                          <FloatingInput
                            className="md:col-span-2"
                            defaultValue={lecture.title}
                            label="Lecture title"
                            name="title"
                            required
                          />
                          <FloatingInput
                            className="font-mono text-sm"
                            defaultValue={lecture.position}
                            label="Position"
                            min="0"
                            name="position"
                            required
                            type="number"
                          />
                          <FloatingInput
                            className="font-mono text-sm"
                            defaultValue={lecture.durationSeconds ?? ""}
                            label="Duration"
                            min="0"
                            name="durationSeconds"
                            placeholder="seconds"
                            type="number"
                          />
                          <FloatingInput
                            className="md:col-span-2 font-mono text-sm"
                            defaultValue={lecture.videoRef ?? ""}
                            label="Video reference"
                            name="videoRef"
                            placeholder="r2/object-key.mp4"
                          />
                          <VideoUploadControl
                            courseId={courseId}
                            lectureId={lecture.id}
                          />
                          <div className="grid gap-4 md:col-span-4 md:grid-cols-2">
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
                          <div className="md:col-span-4">
                            <QuizBuilder
                              courseId={courseId}
                              quiz={lecture.quiz}
                              targetId={lecture.id}
                              targetLabel={lecture.title}
                              targetType="lecture"
                            />
                          </div>
                          <div className="grid gap-2">
                            <p className="text-sm text-muted-foreground">
                              Provider
                            </p>
                            <Select
                              defaultValue={lecture.videoProvider}
                              name="videoProvider"
                            >
                              <SelectTrigger className="w-full rounded-2xl border-border bg-input/20">
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
                            className="font-mono text-sm"
                            defaultValue={toDateTimeLocal(lecture.availableAt)}
                            label="Available at"
                            name="availableAt"
                            type="datetime-local"
                          />
                          <FloatingTextarea
                            className="md:col-span-4"
                            defaultValue={lecture.description ?? ""}
                            label="Description"
                            name="description"
                          />
                          <div className="flex flex-wrap gap-5 text-sm md:col-span-3">
                            <label className="flex items-center gap-2 text-muted-foreground">
                              <Checkbox
                                defaultChecked={lecture.isPreview}
                                name="isPreview"
                              />
                              Free preview
                            </label>
                            <label className="flex items-center gap-2 text-muted-foreground">
                              <Checkbox
                                defaultChecked={lecture.isPublished}
                                name="isPublished"
                              />
                              Published
                            </label>
                          </div>
                          <div className="flex gap-3">
                            <Button type="submit">Save</Button>
                            <Button
                              formAction={deleteInstructorLectureAction}
                              type="submit"
                              variant="destructive"
                            >
                              Delete
                            </Button>
                          </div>
                        </form>
                        <div className="grid gap-3 border border-border bg-background p-4">
                          <h4 className="text-base tracking-tight">
                            Lecture assignment
                          </h4>
                          <AssignmentBuilder
                            assignment={lecture.assignment}
                            courseId={courseId}
                            targetId={lecture.id}
                            targetLabel={lecture.title}
                            targetType="lecture"
                          />
                        </div>
                      </Fragment>
                    ))}
                  </div>

                  <form
                    action={createInstructorLectureAction}
                    className="mt-4 grid gap-4 border border-dashed border-border p-4 md:grid-cols-4"
                  >
                    <input name="courseId" type="hidden" value={courseId} />
                    <input name="sectionId" type="hidden" value={section.id} />
                    <FloatingInput
                      className="md:col-span-2"
                      label="New lecture"
                      name="title"
                      required
                    />
                    <FloatingInput
                      className="font-mono text-sm"
                      defaultValue={nextLecturePosition}
                      label="Position"
                      min="0"
                      name="position"
                      required
                      type="number"
                    />
                    <FloatingInput
                      className="font-mono text-sm"
                      label="Duration"
                      min="0"
                      name="durationSeconds"
                      placeholder="seconds"
                      type="number"
                    />
                    <FloatingInput
                      className="md:col-span-2 font-mono text-sm"
                      label="Video reference"
                      name="videoRef"
                      placeholder="r2/object-key.mp4"
                    />
                    <div className="grid gap-2">
                      <p className="text-sm text-muted-foreground">Provider</p>
                      <Select defaultValue="r2" name="videoProvider">
                        <SelectTrigger className="w-full rounded-2xl border-border bg-input/20">
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
                      className="font-mono text-sm"
                      label="Available at"
                      name="availableAt"
                      type="datetime-local"
                    />
                    <FloatingTextarea
                      className="md:col-span-4"
                      label="Description"
                      name="description"
                    />
                    <div className="flex flex-wrap gap-5 text-sm md:col-span-3">
                      <label className="flex items-center gap-2 text-muted-foreground">
                        <Checkbox name="isPreview" />
                        Free preview
                      </label>
                      <label className="flex items-center gap-2 text-muted-foreground">
                        <Checkbox name="isPublished" />
                        Published
                      </label>
                    </div>
                    <Button className="w-fit" type="submit">
                      Add lecture
                    </Button>
                  </form>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
