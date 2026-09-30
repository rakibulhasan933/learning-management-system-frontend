import type { InstructorCourseStructureResponse } from "@/lib/types"

import { SubmitButton } from "@/components/submit-button"
import { VideoUploadControl } from "./video-upload-control"
import { Card, CardContent } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"

import {
  createInstructorModuleAction,
  createInstructorSectionAction,
  createInstructorVideoAction,
} from "./actions"
import { AssignmentBuilder } from "./assignment-builder"
import { QuizBuilder } from "./quiz-builder"
import { MaterialUploadControl } from "./material-upload-control"

export function MilestoneModuleBuilder({
  courseId,
  structure,
}: {
  courseId: string
  structure: InstructorCourseStructureResponse
}) {
  return (
    <section className="grid gap-5">
      <div>
        <div className="h-px w-20 bg-primary" />
        <h2 className="mt-4 font-heading text-2xl tracking-tight">
          Milestones and modules
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Create milestones, add as many modules as you need, then add multiple
          videos, PDFs, quizzes, and assignments inside each module.
        </p>
      </div>

      {structure.milestones.map((milestone, index) => (
        <Card key={milestone.id}>
          <CardContent className="grid gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-primary">
                  Milestone {index + 1}
                </p>
                <h3 className="mt-2 font-heading text-2xl">
                  {milestone.title}
                </h3>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {milestone.modules.length} module
                {milestone.modules.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid gap-3">
              {milestone.modules.map((module, moduleIndex) => {
                const allows = (
                  contentType: "video" | "pdf" | "quiz" | "assignment"
                ) =>
                  module.contentTypes.length === 0 ||
                  module.contentTypes.includes(contentType)

                return (
                  <article
                    className="grid gap-4 rounded-2xl border border-border p-4"
                    key={module.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-primary">
                          Module {moduleIndex + 1}
                        </p>
                        <h4 className="mt-1 font-heading text-xl">
                          {module.title}
                        </h4>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {module.videos.length} video
                        {module.videos.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {allows("video") ? (
                      <div className="grid gap-2">
                        {module.videos.map((video, videoIndex) => (
                          <div className="grid gap-2" key={video.id}>
                            <div className="flex items-center justify-between rounded-xl bg-background p-3 text-sm ring-1 ring-foreground/10">
                              <span className="min-w-0 truncate">
                                <span className="mr-2 font-mono text-xs text-primary">
                                  {videoIndex + 1}
                                </span>
                                {video.title}
                              </span>
                              <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                                {video.isPublished ? "Published" : "Draft"}
                              </span>
                            </div>
                            <VideoUploadControl
                              courseId={courseId}
                              lectureId=""
                              videoId={video.id}
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {allows("video") ? (
                      <form
                        action={createInstructorVideoAction}
                        className="grid gap-3 rounded-xl border border-dashed border-border p-3 sm:grid-cols-2"
                      >
                        <input name="courseId" type="hidden" value={courseId} />
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
                        <input name="durationSeconds" type="hidden" value="" />
                        <p className="rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground sm:col-span-2">
                          Video {module.videos.length + 1} · title, order, and
                          duration will be detected automatically after upload.
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground sm:col-span-2">
                          <label className="flex items-center gap-2">
                            <input name="isPreview" type="checkbox" /> Free
                            preview
                          </label>
                          <label className="flex items-center gap-2">
                            <input name="isPublished" type="checkbox" />{" "}
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
                    ) : null}

                    {allows("pdf") ? (
                      <div className="grid gap-3">
                        <MaterialUploadControl
                          courseId={courseId}
                          kind="pdf"
                          lectureId=""
                          moduleId={module.id}
                          url={module.pdfUrl}
                        />
                      </div>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2">
                      {allows("quiz") ? (
                        <QuizBuilder
                          courseId={courseId}
                          quiz={module.quiz}
                          targetId={module.id}
                          targetLabel={module.title}
                          targetType="module"
                        />
                      ) : null}
                      {allows("assignment") ? (
                        <AssignmentBuilder
                          assignment={module.assignment}
                          courseId={courseId}
                          targetId={module.id}
                          targetLabel={module.title}
                          targetType="module"
                        />
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>

            <form
              action={createInstructorModuleAction}
              className="grid gap-3 rounded-xl border border-dashed border-border p-3 sm:grid-cols-[1fr_140px_auto]"
            >
              <input name="courseId" type="hidden" value={courseId} />
              <input name="milestoneId" type="hidden" value={milestone.id} />
              <FloatingInput label="New module title" name="title" required />
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Create the module with its name first. Add Video, PDF, Quiz, or
                Assignment from inside the module.
              </p>
              <SubmitButton
                className="sm:self-end"
                pendingLabel="Adding module..."
              >
                Add module
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      ))}

      <form
        action={createInstructorSectionAction}
        className="grid gap-3 rounded-2xl border border-dashed border-border p-4 sm:grid-cols-[1fr_140px_auto]"
      >
        <input name="courseId" type="hidden" value={courseId} />
        <FloatingInput label="New milestone title" name="title" required />
        <input name="dripAfterDays" type="hidden" value="0" />
        <SubmitButton
          className="sm:self-end"
          pendingLabel="Adding milestone..."
        >
          Add milestone
        </SubmitButton>
      </form>
    </section>
  )
}
