import type { InstructorCourseStructureResponse } from "@workspace/types"

import { SubmitButton } from "@/components/submit-button"
import { AssignmentBuilder } from "./assignment-builder"
import {
  addInstructorModuleContentAction,
  createInstructorModuleAction,
  createInstructorSectionAction,
  createInstructorVideoAction,
  deleteInstructorModuleAction,
  deleteInstructorVideoAction,
  publishInstructorVideoAction,
  updateInstructorModuleAction,
} from "./actions"
import { MaterialUploadControl } from "./material-upload-control"
import { QuizBuilder } from "./quiz-builder"
import { VideoUploadControl } from "./video-upload-control"
import { FloatingInput } from "@workspace/ui/components/floating-input"

export function MilestoneModuleBuilder({
  courseId,
  structure,
}: {
  courseId: string
  structure: InstructorCourseStructureResponse
}) {
  const contentTypeLabels = {
    video: "Video",
    pdf: "PDF",
    quiz: "Quiz",
    assignment: "Assignment",
  } as const

  return (
    <section className="grid gap-5">
      <header className="border-b border-border pb-5">
        <div className="h-px w-16 bg-primary" />
        <h2 className="mt-4 font-heading text-2xl tracking-tight">
          Course outline
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Open one milestone at a time, then add only the content this course
          needs.
        </p>
      </header>

      {structure.milestones.map((milestone, index) => (
        <details
          className="group rounded-3xl border border-border bg-card"
          key={milestone.id}
          open={index === 0}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 marker:hidden sm:p-5 [&::-webkit-details-marker]:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-mono text-xs text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[10px] text-muted-foreground">
                  Milestone
                </p>
                <h3 className="mt-1 truncate font-heading text-xl">
                  {milestone.title}
                </h3>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground">
              {milestone.modules.length} module
              {milestone.modules.length === 1 ? "" : "s"}
              <span className="text-primary transition-transform group-open:rotate-180">
                ⌄
              </span>
            </span>
          </summary>

          <div className="grid gap-4 border-t border-border p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <p className="font-mono text-xs text-muted-foreground">
                Modules in this milestone
              </p>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-3">
              {milestone.modules.map((module, moduleIndex) => {
                const selectedContentTypes =
                  module.contentTypes.length > 0
                    ? module.contentTypes
                    : [
                        ...(module.videos.length > 0 ? ["video" as const] : []),
                        ...(module.pdfUrl ? ["pdf" as const] : []),
                        ...(module.quiz ? ["quiz" as const] : []),
                        ...(module.assignment ? ["assignment" as const] : []),
                      ]
                return (
                  <details
                    className="group/module rounded-2xl border border-border bg-background"
                    key={module.id}
                    open={index === 0 && moduleIndex === 0}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 marker:hidden [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] text-primary">
                          Module {String(moduleIndex + 1).padStart(2, "0")}
                        </p>
                        <h4 className="mt-1 truncate font-heading text-lg">
                          {module.title}
                        </h4>
                      </div>
                      <span className="flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground">
                        {selectedContentTypes
                          .map(
                            (type) =>
                              contentTypeLabels[
                                type as keyof typeof contentTypeLabels
                              ]
                          )
                          .join(" + ")}
                        <span className="hidden text-primary sm:inline">
                          · Open to manage
                        </span>
                        <span className="text-primary transition-transform group-open/module:rotate-180">
                          ⌄
                        </span>
                      </span>
                    </summary>

                    <div className="grid gap-4 border-t border-border p-4">
                      <div className="grid gap-2 rounded-xl border border-border/70 bg-card p-3">
                        <p className="font-mono text-[10px] text-muted-foreground">
                          Module settings
                        </p>
                        <form
                          action={updateInstructorModuleAction}
                          className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                        >
                          <input
                            name="courseId"
                            type="hidden"
                            value={courseId}
                          />
                          <input
                            name="moduleId"
                            type="hidden"
                            value={module.id}
                          />
                          <FloatingInput
                            defaultValue={module.title}
                            label="Module title"
                            name="title"
                            required
                          />
                          <SubmitButton
                            className="sm:self-end"
                            pendingLabel="Saving..."
                          >
                            Save changes
                          </SubmitButton>
                        </form>
                        <div className="grid gap-2 border-t border-border/70 pt-3">
                          <div>
                            <p className="font-mono text-[10px] text-muted-foreground">
                              Add content
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Choose what you want to add next. Only the
                              selected content editor will appear.
                            </p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-4">
                            {(
                              Object.keys(contentTypeLabels) as Array<
                                keyof typeof contentTypeLabels
                              >
                            ).map((contentType) =>
                              contentType === "video" ||
                              !selectedContentTypes.includes(contentType) ? (
                                <form
                                  action={addInstructorModuleContentAction}
                                  key={contentType}
                                >
                                  <input
                                    name="courseId"
                                    type="hidden"
                                    value={courseId}
                                  />
                                  <input
                                    name="moduleId"
                                    type="hidden"
                                    value={module.id}
                                  />
                                  {selectedContentTypes.map(
                                    (currentType, currentIndex) => (
                                      <input
                                        key={`${currentType}-${currentIndex}`}
                                        name="contentTypes"
                                        type="hidden"
                                        value={currentType}
                                      />
                                    )
                                  )}
                                  <input
                                    name="contentType"
                                    type="hidden"
                                    value={contentType}
                                  />
                                  <SubmitButton
                                    className="w-full"
                                    pendingLabel={`Adding ${contentTypeLabels[contentType]}...`}
                                    variant="outline"
                                  >
                                    {contentType === "video" &&
                                    selectedContentTypes.includes("video")
                                      ? "Add another video"
                                      : `Add ${contentTypeLabels[contentType]}`}
                                  </SubmitButton>
                                </form>
                              ) : (
                                <div
                                  className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-primary"
                                  key={contentType}
                                >
                                  {contentTypeLabels[contentType]} added
                                </div>
                              )
                            )}
                          </div>
                        </div>
                        <form action={deleteInstructorModuleAction}>
                          <input
                            name="courseId"
                            type="hidden"
                            value={courseId}
                          />
                          <input
                            name="moduleId"
                            type="hidden"
                            value={module.id}
                          />
                          <SubmitButton
                            className="w-full sm:w-auto"
                            pendingLabel="Deleting..."
                            variant="destructive"
                          >
                            Delete module
                          </SubmitButton>
                        </form>
                      </div>
                      {selectedContentTypes.includes("video") ? (
                        <div className="grid gap-3">
                          <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
                            <div>
                              <p className="font-mono text-xs text-primary">
                                Videos
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Add one or more videos to this module.
                              </p>
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {module.videos.length} total
                            </span>
                          </div>
                          {module.videos.map((video) => (
                            <div
                              className="grid gap-3 rounded-xl border border-border bg-card p-3"
                              key={video.id}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="truncate text-sm font-medium">
                                  {video.title}
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {video.isPublished ? "Published" : "Draft"}
                                </span>
                              </div>
                              <VideoUploadControl
                                courseId={courseId}
                                lectureId=""
                                videoId={video.id}
                              />
                              <div className="flex flex-wrap gap-2">
                                {!video.isPublished && video.videoRef ? (
                                  <form action={publishInstructorVideoAction}>
                                    <input
                                      name="courseId"
                                      type="hidden"
                                      value={courseId}
                                    />
                                    <input
                                      name="videoId"
                                      type="hidden"
                                      value={video.id}
                                    />
                                    <SubmitButton pendingLabel="Publishing...">
                                      Publish video
                                    </SubmitButton>
                                  </form>
                                ) : null}
                                <form action={deleteInstructorVideoAction}>
                                  <input
                                    name="courseId"
                                    type="hidden"
                                    value={courseId}
                                  />
                                  <input
                                    name="videoId"
                                    type="hidden"
                                    value={video.id}
                                  />
                                  <SubmitButton
                                    className="w-full sm:w-fit"
                                    pendingLabel="Deleting..."
                                    variant="destructive"
                                  >
                                    Delete video
                                  </SubmitButton>
                                </form>
                              </div>
                            </div>
                          ))}
                          <form
                            action={createInstructorVideoAction}
                            className="grid gap-3 rounded-xl border border-dashed border-primary/50 bg-primary/5 p-4 sm:grid-cols-2"
                          >
                            <input
                              name="courseId"
                              type="hidden"
                              value={courseId}
                            />
                            <input
                              name="moduleId"
                              type="hidden"
                              value={module.id}
                            />
                            <input
                              name="title"
                              type="hidden"
                              value={`Video ${module.videos.length + 1}`}
                            />
                            <input
                              name="position"
                              type="hidden"
                              value={module.videos.length}
                            />
                            <input
                              name="durationSeconds"
                              type="hidden"
                              value=""
                            />
                            <p className="rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground sm:col-span-2">
                              <span className="font-medium text-foreground">
                                Add video {module.videos.length + 1}
                              </span>
                              <span className="mt-1 block text-xs">
                                Title, order, and duration will be detected
                                automatically after upload.
                              </span>
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground sm:col-span-2">
                              <label className="flex items-center gap-2">
                                <input name="isPreview" type="checkbox" /> Free
                                preview
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  defaultChecked
                                  name="isPublished"
                                  type="checkbox"
                                />{" "}
                                Published
                              </label>
                            </div>
                            <SubmitButton
                              className="w-fit"
                              pendingLabel="Adding video..."
                            >
                              Add video
                            </SubmitButton>
                          </form>
                        </div>
                      ) : null}
                      {selectedContentTypes.includes("pdf") ? (
                        <div className="grid gap-3 rounded-xl border border-border p-3">
                          <div>
                            <p className="font-mono text-xs text-primary">
                              PDF
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Upload one PDF for this module.
                            </p>
                          </div>
                          <MaterialUploadControl
                            courseId={courseId}
                            kind="pdf"
                            lectureId=""
                            moduleId={module.id}
                            url={module.pdfUrl}
                          />
                        </div>
                      ) : null}
                      {selectedContentTypes.includes("quiz") ? (
                        <QuizBuilder
                          courseId={courseId}
                          quiz={module.quiz}
                          targetId={module.id}
                          targetLabel={module.title}
                          targetType="module"
                        />
                      ) : null}
                      {selectedContentTypes.includes("assignment") ? (
                        <AssignmentBuilder
                          assignment={module.assignment}
                          courseId={courseId}
                          targetId={module.id}
                          targetLabel={module.title}
                          targetType="module"
                        />
                      ) : null}
                      {selectedContentTypes.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-4 text-sm text-muted-foreground">
                          This module is empty. Use “Add content” above to
                          choose Video, PDF, Quiz, or Assignment.
                        </p>
                      ) : null}
                    </div>
                  </details>
                )
              })}
            </div>

            <form
              action={createInstructorModuleAction}
              className="grid gap-3 rounded-2xl border border-dashed border-secondary/50 bg-secondary/5 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <input name="courseId" type="hidden" value={courseId} />
              <input name="milestoneId" type="hidden" value={milestone.id} />
              <div className="sm:col-span-2">
                <p className="font-mono text-xs text-secondary">
                  Add module to this milestone
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Modules are the smaller learning units inside “
                  {milestone.title}”.
                </p>
              </div>
              <FloatingInput label="Module name" name="title" required />
              <SubmitButton
                className="sm:self-end"
                pendingLabel="Creating module..."
              >
                Create module
              </SubmitButton>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                You can add Video, PDF, Quiz, or Assignment after creating the
                module.
              </p>
            </form>
          </div>
        </details>
      ))}

      <form
        action={createInstructorSectionAction}
        className="grid gap-4 rounded-3xl border border-dashed border-primary/60 bg-card p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6"
      >
        <div className="sm:col-span-2">
          <p className="font-mono text-xs text-primary">
            Create next milestone
          </p>
          <h3 className="mt-1 font-heading text-xl">
            Start a new learning stage
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A milestone contains one or more modules. Use this for a larger
            chapter or phase.
          </p>
        </div>
        <input name="courseId" type="hidden" value={courseId} />
        <FloatingInput label="Milestone name" name="title" required />
        <input name="dripAfterDays" type="hidden" value="0" />
        <SubmitButton
          className="sm:self-end"
          pendingLabel="Adding milestone..."
        >
          Create milestone
        </SubmitButton>
      </form>
    </section>
  )
}
