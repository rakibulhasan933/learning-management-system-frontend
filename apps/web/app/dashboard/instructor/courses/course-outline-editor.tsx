import type { InstructorCourseOutlineResponse } from "@workspace/types"

import {
  createInstructorLectureAction,
  createInstructorSectionAction,
  deleteInstructorLectureAction,
  deleteInstructorSectionAction,
  updateInstructorLectureAction,
  updateInstructorSectionAction,
} from "./actions"

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

const inputClass =
  "mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
const compactInputClass =
  "mt-2 w-full border border-input bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"

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
        <label className="block text-sm">
          Section title
          <input className={inputClass} name="title" required />
        </label>
        <label className="block text-sm">
          Drip days
          <input
            className={compactInputClass}
            defaultValue="0"
            min="0"
            name="dripAfterDays"
            required
            type="number"
          />
        </label>
        <label className="block text-sm">
          Position
          <input
            className={compactInputClass}
            defaultValue={nextSectionPosition}
            min="0"
            name="position"
            required
            type="number"
          />
        </label>
        <label className="block text-sm md:col-span-3">
          Description
          <textarea
            className="mt-2 min-h-20 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
            name="description"
          />
        </label>
        <button
          className="h-fit self-end bg-primary px-5 py-3 text-sm text-primary-foreground"
          type="submit"
        >
          Add section
        </button>
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
                    <label className="block text-sm">
                      Section title
                      <input
                        className={inputClass}
                        defaultValue={section.title}
                        name="title"
                        required
                      />
                    </label>
                    <label className="block text-sm">
                      Drip days
                      <input
                        className={compactInputClass}
                        defaultValue={section.dripAfterDays}
                        min="0"
                        name="dripAfterDays"
                        required
                        type="number"
                      />
                    </label>
                    <label className="block text-sm">
                      Position
                      <input
                        className={compactInputClass}
                        defaultValue={section.position}
                        min="0"
                        name="position"
                        required
                        type="number"
                      />
                    </label>
                    <label className="block text-sm md:col-span-3">
                      Description
                      <textarea
                        className="mt-2 min-h-20 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                        defaultValue={section.description ?? ""}
                        name="description"
                      />
                    </label>
                    <button
                      className="w-fit bg-secondary px-4 py-2 text-sm text-secondary-foreground"
                      type="submit"
                    >
                      Save section
                    </button>
                  </form>
                  <form action={deleteInstructorSectionAction}>
                    <input name="courseId" type="hidden" value={courseId} />
                    <input name="sectionId" type="hidden" value={section.id} />
                    <button
                      className="mt-7 border border-destructive px-4 py-2 text-sm text-destructive"
                      type="submit"
                    >
                      Delete
                    </button>
                  </form>
                </div>

                <div className="border-l border-primary pl-4">
                  <h3 className="text-lg tracking-tight">Lectures</h3>
                  <div className="mt-4 grid gap-4">
                    {section.lectures.map((lecture) => (
                      <form
                        action={updateInstructorLectureAction}
                        className="grid gap-4 border border-border bg-background p-4 md:grid-cols-4"
                        key={lecture.id}
                      >
                        <input name="courseId" type="hidden" value={courseId} />
                        <input name="lectureId" type="hidden" value={lecture.id} />
                        <label className="block text-sm md:col-span-2">
                          Lecture title
                          <input
                            className={inputClass}
                            defaultValue={lecture.title}
                            name="title"
                            required
                          />
                        </label>
                        <label className="block text-sm">
                          Position
                          <input
                            className={compactInputClass}
                            defaultValue={lecture.position}
                            min="0"
                            name="position"
                            required
                            type="number"
                          />
                        </label>
                        <label className="block text-sm">
                          Duration
                          <input
                            className={compactInputClass}
                            defaultValue={lecture.durationSeconds ?? ""}
                            min="0"
                            name="durationSeconds"
                            placeholder="seconds"
                            type="number"
                          />
                        </label>
                        <label className="block text-sm md:col-span-2">
                          Video reference
                          <input
                            className={compactInputClass}
                            defaultValue={lecture.videoRef ?? ""}
                            name="videoRef"
                            placeholder="r2/object-key.mp4"
                          />
                        </label>
                        <label className="block text-sm">
                          Provider
                          <select
                            className={inputClass}
                            defaultValue={lecture.videoProvider}
                            name="videoProvider"
                          >
                            <option value="r2">R2</option>
                            <option value="bunny">Bunny</option>
                            <option value="cloudflare_stream">
                              Cloudflare Stream
                            </option>
                            <option value="mux">Mux</option>
                          </select>
                        </label>
                        <label className="block text-sm">
                          Available at
                          <input
                            className={compactInputClass}
                            defaultValue={toDateTimeLocal(lecture.availableAt)}
                            name="availableAt"
                            type="datetime-local"
                          />
                        </label>
                        <label className="block text-sm md:col-span-4">
                          Description
                          <textarea
                            className="mt-2 min-h-20 w-full border border-input bg-card px-3 py-2 text-foreground outline-none focus:border-primary"
                            defaultValue={lecture.description ?? ""}
                            name="description"
                          />
                        </label>
                        <div className="flex flex-wrap gap-5 text-sm md:col-span-3">
                          <label className="flex items-center gap-2">
                            <input
                              defaultChecked={lecture.isPreview}
                              name="isPreview"
                              type="checkbox"
                            />
                            Free preview
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              defaultChecked={lecture.isPublished}
                              name="isPublished"
                              type="checkbox"
                            />
                            Published
                          </label>
                        </div>
                        <div className="flex gap-3">
                          <button
                            className="bg-secondary px-4 py-2 text-sm text-secondary-foreground"
                            type="submit"
                          >
                            Save
                          </button>
                          <button
                            className="border border-destructive px-4 py-2 text-sm text-destructive"
                            formAction={deleteInstructorLectureAction}
                            type="submit"
                          >
                            Delete
                          </button>
                        </div>
                      </form>
                    ))}
                  </div>

                  <form
                    action={createInstructorLectureAction}
                    className="mt-4 grid gap-4 border border-dashed border-border p-4 md:grid-cols-4"
                  >
                    <input name="courseId" type="hidden" value={courseId} />
                    <input name="sectionId" type="hidden" value={section.id} />
                    <label className="block text-sm md:col-span-2">
                      New lecture
                      <input className={inputClass} name="title" required />
                    </label>
                    <label className="block text-sm">
                      Position
                      <input
                        className={compactInputClass}
                        defaultValue={nextLecturePosition}
                        min="0"
                        name="position"
                        required
                        type="number"
                      />
                    </label>
                    <label className="block text-sm">
                      Duration
                      <input
                        className={compactInputClass}
                        min="0"
                        name="durationSeconds"
                        placeholder="seconds"
                        type="number"
                      />
                    </label>
                    <label className="block text-sm md:col-span-2">
                      Video reference
                      <input
                        className={compactInputClass}
                        name="videoRef"
                        placeholder="r2/object-key.mp4"
                      />
                    </label>
                    <label className="block text-sm">
                      Provider
                      <select
                        className={inputClass}
                        defaultValue="r2"
                        name="videoProvider"
                      >
                        <option value="r2">R2</option>
                        <option value="bunny">Bunny</option>
                        <option value="cloudflare_stream">
                          Cloudflare Stream
                        </option>
                        <option value="mux">Mux</option>
                      </select>
                    </label>
                    <label className="block text-sm">
                      Available at
                      <input
                        className={compactInputClass}
                        name="availableAt"
                        type="datetime-local"
                      />
                    </label>
                    <label className="block text-sm md:col-span-4">
                      Description
                      <textarea
                        className="mt-2 min-h-20 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                        name="description"
                      />
                    </label>
                    <div className="flex flex-wrap gap-5 text-sm md:col-span-3">
                      <label className="flex items-center gap-2">
                        <input name="isPreview" type="checkbox" />
                        Free preview
                      </label>
                      <label className="flex items-center gap-2">
                        <input name="isPublished" type="checkbox" />
                        Published
                      </label>
                    </div>
                    <button
                      className="w-fit bg-primary px-4 py-2 text-sm text-primary-foreground"
                      type="submit"
                    >
                      Add lecture
                    </button>
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
