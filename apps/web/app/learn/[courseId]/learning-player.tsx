"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import {
  Check,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  PlayCircle,
} from "lucide-react"
import type {
  LearningCourseResponse,
  LearningLectureDto,
  LearningModuleDto,
  LectureProgressDto,
} from "@workspace/types"

import { AssignmentPanel } from "./assignment-panel"
import { getLectureVideoUrlAction, saveLectureProgressAction } from "./actions"
import { LecturePlayer } from "./lecture-player"
import { QuizPanel } from "./quiz-panel"
import { Button } from "@workspace/ui/components/button"
import { ProgressThread } from "@workspace/ui/components/progress-thread"
import { cn } from "@workspace/ui/lib/utils"

interface LearningPlayerProps {
  course: LearningCourseResponse["course"]
  learnerEmail: string
  sections: LearningCourseResponse["sections"]
}

type LearningContentItem =
  | { id: string; moduleId: string; title: string; type: "lecture" }
  | { id: string; title: string; type: "pdf"; moduleId: string }
  | { id: string; moduleId: string; title: string; type: "quiz" }
  | { id: string; moduleId: string; title: string; type: "assignment" }

function getModuleContentItems(
  module: LearningModuleDto
): LearningContentItem[] {
  const types =
    module.contentTypes.length > 0
      ? module.contentTypes
      : [
          ...(module.videos.length > 0 ? ["video" as const] : []),
          ...(module.pdfUrl ? ["pdf" as const] : []),
          ...(module.quiz ? ["quiz" as const] : []),
          ...(module.assignment ? ["assignment" as const] : []),
        ]
  const items: LearningContentItem[] = []
  let videoIndex = 0
  let hasPdf = false
  let hasQuiz = false
  let hasAssignment = false
  for (const type of types) {
    if (type === "video") {
      const video = module.videos[videoIndex++]
      if (video)
        items.push({
          id: video.id,
          moduleId: module.id,
          title: video.title,
          type: "lecture",
        })
    } else if (
      type === "pdf" &&
      !hasPdf &&
      (module.pdfUrl || module.slidesUrl)
    ) {
      hasPdf = true
      items.push({
        id: module.id,
        moduleId: module.id,
        title: "PDF",
        type: "pdf",
      })
    } else if (type === "quiz" && !hasQuiz && module.quiz) {
      hasQuiz = true
      items.push({
        id: module.quiz.id,
        moduleId: module.id,
        title: module.quiz.title,
        type: "quiz",
      })
    } else if (type === "assignment" && !hasAssignment && module.assignment) {
      hasAssignment = true
      items.push({
        id: module.assignment.id,
        moduleId: module.id,
        title: module.assignment.title,
        type: "assignment",
      })
    }
  }
  return items
}

function getWatermarkPosition() {
  return {
    left: `${10 + Math.floor(Math.random() * 70)}%`,
    top: `${12 + Math.floor(Math.random() * 65)}%`,
  }
}

function formatDuration(seconds: number | null) {
  if (!seconds) {
    return ""
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

function getProgressPercent(
  lecture: LearningLectureDto | undefined,
  progress: LectureProgressDto | null | undefined
) {
  if (!lecture?.durationSeconds || !progress?.positionSeconds) {
    return 0
  }

  return Math.min(
    100,
    (progress.positionSeconds / lecture.durationSeconds) * 100
  )
}

export function LearningPlayer({
  course,
  learnerEmail,
  sections,
}: LearningPlayerProps) {
  const lectures = useMemo(
    () => sections.flatMap((section) => section.lectures),
    [sections]
  )
  const contentItems = useMemo<LearningContentItem[]>(
    () =>
      sections.flatMap((section) =>
        section.modules.flatMap(getModuleContentItems)
      ),
    [sections]
  )
  const [selectedLectureId, setSelectedLectureId] = useState(
    lectures[0]?.id ?? null
  )
  const [activeContent, setActiveContent] = useState<
    | { id: string; type: "lecture" }
    | { id: string; type: "pdf" }
    | { id: string; type: "quiz" }
    | { id: string; type: "assignment" }
  >(
    lectures[0]
      ? { id: lectures[0].id, type: "lecture" }
      : { id: "", type: "lecture" }
  )
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [openMilestoneId, setOpenMilestoneId] = useState<string | null>(
    sections[0]?.id ?? null
  )
  const [openModuleId, setOpenModuleId] = useState<string | null>(
    sections[0]?.modules[0]?.id ?? null
  )
  const [lectureProgress, setLectureProgress] = useState<
    Record<string, LectureProgressDto | null>
  >(() =>
    Object.fromEntries(
      lectures.map((lecture) => [lecture.id, lecture.progress ?? null])
    )
  )
  // Keep the server and first client render deterministic. The watermark starts
  // centered, then begins moving only after hydration completes.
  const [watermarkPosition, setWatermarkPosition] = useState({
    left: "50%",
    top: "50%",
  })
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSavedPositionRef = useRef<Record<string, number>>({})
  const lectureProgressRef = useRef(lectureProgress)

  const selectedLecture = lectures.find(
    (lecture) => lecture.id === selectedLectureId
  )
  const selectedProgress = selectedLectureId
    ? (lectureProgress[selectedLectureId] ?? null)
    : null
  const completedLectureCount = lectures.filter(
    (lecture) => lectureProgress[lecture.id]?.isCompleted
  ).length
  const completionPercentage =
    course.totalLectureCount === 0
      ? 0
      : Math.round((completedLectureCount / course.totalLectureCount) * 100)

  useEffect(() => {
    lectureProgressRef.current = lectureProgress
  }, [lectureProgress])

  useEffect(() => {
    if (!selectedLectureId || activeContent.type !== "lecture") {
      return
    }

    startTransition(async () => {
      try {
        const response = await getLectureVideoUrlAction(selectedLectureId)

        setVideoUrl(response.url)
        setMessage(null)
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Video could not be loaded."
        )
      }
    })
  }, [activeContent.type, lectures, selectedLectureId])

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    function scheduleMove() {
      timeoutId = setTimeout(
        () => {
          setWatermarkPosition(getWatermarkPosition())
          scheduleMove()
        },
        8000 + Math.floor(Math.random() * 4000)
      )
    }

    timeoutId = setTimeout(() => {
      setWatermarkPosition(getWatermarkPosition())
      scheduleMove()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [])

  async function saveProgress({
    isCompleted,
    lectureId,
    positionSeconds,
  }: {
    isCompleted?: boolean
    lectureId: string
    positionSeconds: number
  }) {
    try {
      const response = await saveLectureProgressAction({
        isCompleted,
        lectureId,
        positionSeconds,
      })

      setLectureProgress((current) => ({
        ...current,
        [lectureId]: response.progress,
      }))
    } catch {
      setMessage("Progress could not be saved.")
    }
  }

  function getCurrentPositionSeconds() {
    return Math.max(0, Math.floor(videoRef.current?.currentTime ?? 0))
  }

  function saveCurrentProgress() {
    if (!selectedLectureId) {
      return
    }

    void saveProgress({
      lectureId: selectedLectureId,
      positionSeconds: getCurrentPositionSeconds(),
    })
  }

  function handleTimeUpdate() {
    const video = videoRef.current

    if (!video?.duration) {
      return
    }

    if (!selectedLectureId) {
      return
    }

    const positionSeconds = Math.floor(video.currentTime)
    const lastSavedPosition =
      lastSavedPositionRef.current[selectedLectureId] ?? 0

    if (Math.abs(positionSeconds - lastSavedPosition) >= 15) {
      lastSavedPositionRef.current[selectedLectureId] = positionSeconds
      void saveProgress({
        lectureId: selectedLectureId,
        positionSeconds,
      })
    }
  }

  function resumeFromSavedPosition() {
    const video = videoRef.current

    if (!video?.duration || !selectedProgress || selectedProgress.isCompleted) {
      return
    }

    const resumeAt = Math.min(
      selectedProgress.positionSeconds,
      Math.max(0, Math.floor(video.duration) - 2)
    )

    if (resumeAt > 0) {
      video.currentTime = resumeAt
      lastSavedPositionRef.current[selectedProgress.lectureId] = resumeAt
    }
  }

  function markSelectedLectureComplete() {
    if (!selectedLectureId) {
      return
    }

    const video = videoRef.current
    const positionSeconds = Math.max(
      getCurrentPositionSeconds(),
      Math.floor(video?.duration ?? selectedLecture?.durationSeconds ?? 0)
    )

    void saveProgress({
      isCompleted: true,
      lectureId: selectedLectureId,
      positionSeconds,
    })
  }

  function selectLecture(lectureId: string) {
    if (lectureId === selectedLectureId && activeContent.type === "lecture") {
      return
    }

    saveCurrentProgress()
    setSelectedLectureId(lectureId)
    setActiveContent({ id: lectureId, type: "lecture" })
    setVideoUrl(null)
    setMessage(null)
  }

  function selectQuiz(quizId: string) {
    saveCurrentProgress()
    setActiveContent({ id: quizId, type: "quiz" })
    setVideoUrl(null)
    setMessage(null)
  }

  function selectPdf(moduleId: string) {
    saveCurrentProgress()
    setActiveContent({ id: moduleId, type: "pdf" })
    setVideoUrl(null)
    setMessage(null)
  }

  function selectAssignment(assignmentId: string) {
    saveCurrentProgress()
    setActiveContent({ id: assignmentId, type: "assignment" })
    setVideoUrl(null)
    setMessage(null)
  }

  function selectContent(item: LearningContentItem) {
    if (item.type === "lecture") {
      selectLecture(item.id)
    } else if (item.type === "pdf") {
      selectPdf(item.moduleId)
    } else if (item.type === "quiz") {
      selectQuiz(item.id)
    } else {
      selectAssignment(item.id)
    }
  }

  const activeContentIndex = contentItems.findIndex(
    (item) => item.type === activeContent.type && item.id === activeContent.id
  )
  const previousContent =
    activeContentIndex > 0 ? contentItems[activeContentIndex - 1] : null
  const nextContent =
    activeContentIndex >= 0 && activeContentIndex < contentItems.length - 1
      ? contentItems[activeContentIndex + 1]
      : null
  const isNextModule = Boolean(
    nextContent &&
    contentItems[activeContentIndex]?.moduleId !== nextContent.moduleId
  )

  const activeQuiz =
    sections
      .flatMap((section) => section.modules.map((module) => module.quiz))
      .find((quiz) => quiz?.id === activeContent.id) ?? null
  const activeAssignment =
    sections
      .flatMap((section) => section.modules.map((module) => module.assignment))
      .find((assignment) => assignment?.id === activeContent.id) ?? null
  const activePdf =
    sections
      .flatMap((section) => section.modules)
      .find(
        (module) =>
          module.id === activeContent.id && activeContent.type === "pdf"
      ) ?? null

  return (
    <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="min-w-0 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
        <div className="grid gap-2 border-b border-border p-5">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-mono text-xs tracking-wide text-muted-foreground">
              Course completion
            </span>
            <span className="font-mono text-primary tabular-nums">
              {completionPercentage}% ({completedLectureCount}/
              {course.totalLectureCount})
            </span>
          </div>
          <ProgressThread className="w-full" value={completionPercentage} />
        </div>

        {activeContent.type === "lecture" ? (
          <>
            <LecturePlayer
              emptyMessage={message ?? "Select a lecture."}
              isLoading={isPending}
              onEnded={markSelectedLectureComplete}
              onLoadedMetadata={resumeFromSavedPosition}
              onPause={saveCurrentProgress}
              onPlay={() => undefined}
              onTimeUpdate={handleTimeUpdate}
              src={videoUrl}
              videoRef={videoRef}
              watermarkPosition={watermarkPosition}
              watermarkText={learnerEmail}
            />

            <div className="grid gap-5 border-t border-border p-5">
              <div>
                <p className="font-mono text-xs tracking-wide text-muted-foreground">
                  {course.title}
                </p>
                <h2 className="mt-2 font-heading text-xl tracking-tight sm:text-2xl">
                  {selectedLecture?.title ?? "No published modules"}
                </h2>
                {selectedLecture?.description ? (
                  <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                    {selectedLecture.description}
                  </p>
                ) : null}
                {selectedProgress ? (
                  <p className="mt-3 font-mono text-xs text-muted-foreground">
                    {selectedProgress.isCompleted
                      ? `Completed ${selectedProgress.completedAt ? new Date(selectedProgress.completedAt).toLocaleString() : ""}`
                      : `Resume at ${formatDuration(selectedProgress.positionSeconds)}`}
                  </p>
                ) : null}
              </div>

              {selectedLecture?.pdfUrl ||
              selectedLecture?.slidesUrl ||
              selectedLecture?.modulePdfUrl ||
              selectedLecture?.moduleSlidesUrl ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedLecture.modulePdfUrl ? (
                    <a
                      className="flex items-center gap-3 rounded-xl bg-background p-3 text-sm ring-1 ring-foreground/10 transition-colors hover:ring-primary/50"
                      href={selectedLecture.modulePdfUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <FileText className="size-4 text-primary" />
                      <span className="min-w-0 flex-1 truncate">
                        Module PDF
                      </span>
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                    </a>
                  ) : null}
                  {selectedLecture.moduleSlidesUrl ? (
                    <a
                      className="flex items-center gap-3 rounded-xl bg-background p-3 text-sm ring-1 ring-foreground/10 transition-colors hover:ring-primary/50"
                      href={selectedLecture.moduleSlidesUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <FileText className="size-4 text-primary" />
                      <span className="min-w-0 flex-1 truncate">
                        Module slides
                      </span>
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                    </a>
                  ) : null}
                  {selectedLecture.pdfUrl ? (
                    <a
                      className="flex items-center gap-3 rounded-xl bg-background p-3 text-sm ring-1 ring-foreground/10 transition-colors hover:ring-primary/50"
                      href={selectedLecture.pdfUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <FileText className="size-4 text-primary" />
                      <span className="min-w-0 flex-1 truncate">
                        Module PDF
                      </span>
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                    </a>
                  ) : null}
                  {selectedLecture.slidesUrl ? (
                    <a
                      className="flex items-center gap-3 rounded-xl bg-background p-3 text-sm ring-1 ring-foreground/10 transition-colors hover:ring-primary/50"
                      href={selectedLecture.slidesUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <FileText className="size-4 text-primary" />
                      <span className="min-w-0 flex-1 truncate">
                        Module slides
                      </span>
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                    </a>
                  ) : null}
                </div>
              ) : null}

              {message && videoUrl ? (
                <p className="text-sm text-muted-foreground">{message}</p>
              ) : null}
              <div>
                <Button
                  className="w-full sm:w-auto"
                  disabled={!selectedLectureId || selectedProgress?.isCompleted}
                  onClick={markSelectedLectureComplete}
                  type="button"
                  variant="outline"
                >
                  <Check className="size-4" />
                  {selectedProgress?.isCompleted
                    ? "Completed"
                    : "Mark complete"}
                </Button>
              </div>
            </div>
          </>
        ) : activeContent.type === "pdf" && activePdf ? (
          <div className="grid gap-4 border-t border-border p-5 sm:p-7">
            <div>
              <p className="font-mono text-xs text-muted-foreground">
                Module material
              </p>
              <h2 className="mt-2 font-heading text-2xl">{activePdf.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Open the material for this module.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {activePdf.pdfUrl ? (
                <a
                  className="flex items-center gap-3 rounded-xl bg-background p-4 text-sm ring-1 ring-foreground/10 hover:ring-primary/50"
                  href={activePdf.pdfUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <FileText className="size-4 text-primary" />
                  Open PDF
                  <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
                </a>
              ) : null}
              {activePdf.slidesUrl ? (
                <a
                  className="flex items-center gap-3 rounded-xl bg-background p-4 text-sm ring-1 ring-foreground/10 hover:ring-primary/50"
                  href={activePdf.slidesUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <FileText className="size-4 text-primary" />
                  Open slides
                  <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
                </a>
              ) : null}
            </div>
          </div>
        ) : activeContent.type === "quiz" && activeQuiz ? (
          <div className="p-5 sm:p-7">
            <QuizPanel quiz={activeQuiz} />
          </div>
        ) : activeContent.type === "assignment" && activeAssignment ? (
          <div className="p-5 sm:p-7">
            <AssignmentPanel assignment={activeAssignment} />
          </div>
        ) : null}

        {contentItems.length > 0 ? (
          <nav
            aria-label="Course content navigation"
            className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-t border-border bg-background/40 p-3 sm:gap-4 sm:p-4"
          >
            <Button
              className="h-auto min-w-0 justify-start gap-2 rounded-xl border border-transparent px-2.5 py-2.5 text-left hover:border-border hover:bg-card sm:gap-3 sm:px-3"
              disabled={!previousContent}
              onClick={() => previousContent && selectContent(previousContent)}
              type="button"
              variant="ghost"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-primary ring-1 ring-foreground/10 sm:size-9">
                <ArrowLeft className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[10px] text-muted-foreground">
                  Previous
                </span>
                <span className="mt-0.5 block truncate text-xs text-foreground sm:text-sm">
                  {previousContent?.title ?? "First item"}
                </span>
              </span>
            </Button>
            <p className="text-center font-mono text-[10px] text-muted-foreground sm:text-[11px]">
              {activeContentIndex + 1} / {contentItems.length}
            </p>
            <Button
              className="h-auto min-w-0 justify-end gap-2 rounded-xl border border-transparent px-2.5 py-2.5 text-right hover:border-border hover:bg-card sm:gap-3 sm:px-3"
              disabled={!nextContent}
              onClick={() => nextContent && selectContent(nextContent)}
              type="button"
              variant="ghost"
            >
              <span className="min-w-0">
                <span className="block font-mono text-[10px] text-muted-foreground">
                  Next
                </span>
                <span className="mt-0.5 block truncate text-xs text-foreground sm:text-sm">
                  {nextContent
                    ? isNextModule
                      ? "Next module is coming"
                      : nextContent.title
                    : "You have reached the end"}
                </span>
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 sm:size-9">
                <ArrowRight className="size-4" />
              </span>
            </Button>
          </nav>
        ) : null}
      </div>

      <aside className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10 lg:sticky lg:top-6">
        <p className="font-mono text-xs tracking-wide text-muted-foreground">
          Course outline
        </p>
        <ProgressThread className="mt-4 w-full" />
        <div className="mt-5 grid gap-6">
          {sections.map((section) => (
            <details
              className="group/milestone"
              key={section.id}
              open={openMilestoneId === section.id}
              onToggle={(event) => {
                if (event.currentTarget.open) {
                  setOpenMilestoneId(section.id)
                  setOpenModuleId(section.modules[0]?.id ?? null)
                } else if (openMilestoneId === section.id)
                  setOpenMilestoneId(null)
              }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-heading text-base tracking-tight marker:hidden sm:text-lg [&::-webkit-details-marker]:hidden">
                <span>{section.title}</span>
                <span className="font-mono text-xs text-primary transition-transform group-open/milestone:rotate-180">
                  ⌄
                </span>
              </summary>
              <div className="mt-3 grid gap-2">
                {section.modules.map((module) => {
                  const moduleItems = getModuleContentItems(module)

                  return (
                    <details
                      className="group/module rounded-xl border border-foreground/10 p-2"
                      key={module.id}
                      open={openModuleId === module.id}
                      onToggle={(event) => {
                        if (event.currentTarget.open) {
                          setOpenModuleId(module.id)
                          setOpenMilestoneId(section.id)
                        } else if (openModuleId === module.id)
                          setOpenModuleId(null)
                      }}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-1 marker:hidden [&::-webkit-details-marker]:hidden">
                        <span>
                          <span className="block font-mono text-[10px] text-primary">
                            Module {module.position + 1}
                          </span>
                          <span className="mt-1 block font-heading text-base">
                            {module.title}
                          </span>
                        </span>
                        <span className="font-mono text-xs text-primary transition-transform group-open/module:rotate-180">
                          ⌄
                        </span>
                      </summary>
                      <div className="mt-2 grid gap-1">
                        {moduleItems.map((item, contentIndex) => {
                          if (item.type === "lecture") {
                            const lecture = module.videos.find(
                              (video) => video.id === item.id
                            )
                            if (!lecture) return null
                            const progress = lectureProgress[lecture.id]
                            const isActive =
                              activeContent.type === "lecture" &&
                              selectedLectureId === lecture.id
                            const watchedPercent = getProgressPercent(
                              lecture,
                              progress
                            )
                            return (
                              <Button
                                key={item.id}
                                aria-current={isActive ? "true" : undefined}
                                className={cn(
                                  "h-auto min-h-11 w-full flex-col items-start gap-1 rounded-xl px-3 py-2.5 text-left text-sm whitespace-normal ring-1",
                                  isActive
                                    ? "bg-primary/5 text-foreground ring-primary/40"
                                    : "text-muted-foreground ring-foreground/10"
                                )}
                                onClick={() => selectLecture(lecture.id)}
                                type="button"
                                variant="ghost"
                              >
                                <span className="flex w-full items-start gap-2">
                                  <span className="font-mono text-[10px] text-primary">
                                    {String(contentIndex + 1).padStart(2, "0")}
                                  </span>
                                  {progress?.isCompleted ? (
                                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                                  ) : (
                                    <PlayCircle className="mt-0.5 size-3.5 shrink-0 opacity-60" />
                                  )}
                                  <span className="min-w-0 break-words">
                                    {lecture.title}
                                  </span>
                                </span>
                                <span className="flex w-full items-center gap-2 pl-5.5 font-mono text-xs text-muted-foreground">
                                  {progress?.isCompleted ? (
                                    <span className="text-primary">
                                      Complete
                                    </span>
                                  ) : progress?.positionSeconds ? (
                                    <span>
                                      Resume{" "}
                                      {formatDuration(progress.positionSeconds)}
                                    </span>
                                  ) : null}
                                  {lecture.durationSeconds ? (
                                    <span className="ml-auto">
                                      {formatDuration(lecture.durationSeconds)}
                                    </span>
                                  ) : null}
                                </span>
                                {!progress?.isCompleted &&
                                watchedPercent > 0 ? (
                                  <ProgressThread
                                    className="w-full"
                                    value={watchedPercent}
                                  />
                                ) : null}
                              </Button>
                            )
                          }
                          if (item.type === "pdf")
                            return (
                              <Button
                                key={item.id}
                                aria-current={
                                  activeContent.type === "pdf" &&
                                  activeContent.id === module.id
                                    ? "true"
                                    : undefined
                                }
                                className={cn(
                                  "h-auto min-h-10 w-full justify-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm ring-1",
                                  activeContent.type === "pdf" &&
                                    activeContent.id === module.id
                                    ? "bg-primary/5 text-foreground ring-primary/40"
                                    : "text-muted-foreground ring-foreground/10"
                                )}
                                onClick={() => selectPdf(module.id)}
                                type="button"
                                variant="ghost"
                              >
                                <span className="font-mono text-[10px] text-primary">
                                  {String(contentIndex + 1).padStart(2, "0")}
                                </span>
                                <FileText className="size-3.5 text-primary" />
                                PDF
                              </Button>
                            )
                          if (item.type === "quiz")
                            return (
                              <Button
                                key={item.id}
                                className="ml-4 h-auto min-h-9 justify-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-muted-foreground"
                                onClick={() => selectQuiz(item.id)}
                                type="button"
                                variant="ghost"
                              >
                                <span className="font-mono text-[10px] text-primary">
                                  {String(contentIndex + 1).padStart(2, "0")}
                                </span>
                                <HelpCircle className="size-3.5 text-primary" />
                                <span className="truncate">{item.title}</span>
                              </Button>
                            )
                          return (
                            <Button
                              key={item.id}
                              className="ml-4 h-auto min-h-9 justify-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-muted-foreground"
                              onClick={() => selectAssignment(item.id)}
                              type="button"
                              variant="ghost"
                            >
                              <span className="font-mono text-[10px] text-primary">
                                {String(contentIndex + 1).padStart(2, "0")}
                              </span>
                              <ClipboardList className="size-3.5 text-primary" />
                              <span className="truncate">{item.title}</span>
                            </Button>
                          )
                        })}
                      </div>
                    </details>
                  )
                })}
              </div>
            </details>
          ))}
        </div>
      </aside>
    </div>
  )
}
