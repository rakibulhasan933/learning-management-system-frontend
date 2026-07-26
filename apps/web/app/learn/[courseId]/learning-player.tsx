"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import type {
  LearningCourseResponse,
  LearningLectureDto,
  LectureProgressDto,
} from "@workspace/types"

import { AssignmentPanel } from "./assignment-panel"
import { getLectureVideoUrlAction, saveLectureProgressAction } from "./actions"
import { QuizPanel } from "./quiz-panel"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

interface LearningPlayerProps {
  course: LearningCourseResponse["course"]
  learnerEmail: string
  sections: LearningCourseResponse["sections"]
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
  progress: LectureProgressDto | null | undefined,
) {
  if (!lecture?.durationSeconds || !progress?.positionSeconds) {
    return 0
  }

  return Math.min(100, (progress.positionSeconds / lecture.durationSeconds) * 100)
}

export function LearningPlayer({
  course,
  learnerEmail,
  sections,
}: LearningPlayerProps) {
  const lectures = useMemo(
    () => sections.flatMap((section) => section.lectures),
    [sections],
  )
  const [selectedLectureId, setSelectedLectureId] = useState(
    lectures[0]?.id ?? null,
  )
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const [lectureProgress, setLectureProgress] = useState<
    Record<string, LectureProgressDto | null>
  >(() =>
    Object.fromEntries(
      lectures.map((lecture) => [lecture.id, lecture.progress ?? null]),
    ),
  )
  const [watermarkPosition, setWatermarkPosition] = useState(
    getWatermarkPosition,
  )
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSavedPositionRef = useRef<Record<string, number>>({})
  const lectureProgressRef = useRef(lectureProgress)

  const selectedLecture = lectures.find(
    (lecture) => lecture.id === selectedLectureId,
  )
  const selectedProgress = selectedLectureId
    ? lectureProgress[selectedLectureId] ?? null
    : null
  const completedLectureCount = lectures.filter(
    (lecture) => lectureProgress[lecture.id]?.isCompleted,
  ).length
  const completionPercentage =
    course.totalLectureCount === 0
      ? 0
      : Math.round((completedLectureCount / course.totalLectureCount) * 100)

  useEffect(() => {
    lectureProgressRef.current = lectureProgress
  }, [lectureProgress])

  useEffect(() => {
    if (!selectedLectureId) {
      return
    }

    startTransition(async () => {
      try {
        const response = await getLectureVideoUrlAction(selectedLectureId)

        setVideoUrl(response.url)
        setMessage(null)
        setIsPlaying(false)
        setPlaybackProgress(
          getProgressPercent(
            lectures.find((lecture) => lecture.id === selectedLectureId),
            lectureProgressRef.current[selectedLectureId],
          ),
        )
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Video could not be loaded.",
        )
      }
    })
  }, [lectures, selectedLectureId])

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    function scheduleMove() {
      timeoutId = setTimeout(
        () => {
          setWatermarkPosition(getWatermarkPosition())
          scheduleMove()
        },
        8000 + Math.floor(Math.random() * 4000),
      )
    }

    scheduleMove()

    return () => clearTimeout(timeoutId)
  }, [])

  function togglePlayback() {
    const video = videoRef.current

    if (!video) {
      return
    }

    if (video.paused) {
      void video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

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

    setPlaybackProgress((video.currentTime / video.duration) * 100)

    if (!selectedLectureId) {
      return
    }

    const positionSeconds = Math.floor(video.currentTime)
    const lastSavedPosition = lastSavedPositionRef.current[selectedLectureId] ?? 0

    if (Math.abs(positionSeconds - lastSavedPosition) >= 15) {
      lastSavedPositionRef.current[selectedLectureId] = positionSeconds
      void saveProgress({
        lectureId: selectedLectureId,
        positionSeconds,
      })
    }
  }

  function seek(value: string) {
    const video = videoRef.current

    if (!video?.duration) {
      return
    }

    const nextProgress = Number(value)
    video.currentTime = (nextProgress / 100) * video.duration
    setPlaybackProgress(nextProgress)
  }

  function resumeFromSavedPosition() {
    const video = videoRef.current

    if (!video?.duration || !selectedProgress || selectedProgress.isCompleted) {
      return
    }

    const resumeAt = Math.min(
      selectedProgress.positionSeconds,
      Math.max(0, Math.floor(video.duration) - 2),
    )

    if (resumeAt > 0) {
      video.currentTime = resumeAt
      setPlaybackProgress((resumeAt / video.duration) * 100)
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
      Math.floor(video?.duration ?? selectedLecture?.durationSeconds ?? 0),
    )

    setPlaybackProgress(100)
    void saveProgress({
      isCompleted: true,
      lectureId: selectedLectureId,
      positionSeconds,
    })
  }

  function selectLecture(lectureId: string) {
    saveCurrentProgress()
    setSelectedLectureId(lectureId)
    setVideoUrl(null)
    setMessage(null)
    setIsPlaying(false)
    setPlaybackProgress(
      getProgressPercent(
        lectures.find((lecture) => lecture.id === lectureId),
        lectureProgress[lectureId],
      ),
    )
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 border border-border bg-card">
        <div className="grid gap-2 border-b border-border p-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-mono text-muted-foreground">
              Course completion
            </span>
            <span className="font-mono text-primary">
              {completionPercentage}% ({completedLectureCount}/
              {course.totalLectureCount})
            </span>
          </div>
          <div className="h-1.5 bg-background">
            <div
              className="h-full bg-primary"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
        <div className="relative aspect-video bg-background">
          {videoUrl ? (
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              onEnded={() => {
                setIsPlaying(false)
                markSelectedLectureComplete()
              }}
              onLoadedMetadata={resumeFromSavedPosition}
              onPause={() => {
                setIsPlaying(false)
                saveCurrentProgress()
              }}
              onPlay={() => setIsPlaying(true)}
              onTimeUpdate={handleTimeUpdate}
              playsInline
              preload="metadata"
              src={videoUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {isPending
                ? "Preparing video..."
                : (message ?? "Select a lecture.")}
            </div>
          )}
          <div
            className="pointer-events-none absolute max-w-[72%] break-words font-mono text-[11px] text-foreground opacity-20 sm:text-sm"
            style={{
              left: watermarkPosition.left,
              top: watermarkPosition.top,
              transform: "translate(-50%, -50%)",
            }}
          >
            {learnerEmail}
          </div>
        </div>

        <div className="grid gap-4 border-t border-border p-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {course.title}
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl">
              {selectedLecture?.title ?? "No published lectures"}
            </h2>
            {selectedProgress ? (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {selectedProgress.isCompleted
                  ? `Completed ${selectedProgress.completedAt ? new Date(selectedProgress.completedAt).toLocaleString() : ""}`
                  : `Resume at ${formatDuration(selectedProgress.positionSeconds)}`}
              </p>
            ) : null}
          </div>
          {selectedLecture?.quiz ? <QuizPanel quiz={selectedLecture.quiz} /> : null}
          {selectedLecture?.assignment ? (
            <AssignmentPanel assignment={selectedLecture.assignment} />
          ) : null}
          {message && videoUrl ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              className="w-full sm:w-auto"
              disabled={!videoUrl}
              onClick={togglePlayback}
              type="button"
            >
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={!selectedLectureId}
              onClick={markSelectedLectureComplete}
              type="button"
              variant="outline"
            >
              Mark complete
            </Button>
            <Input
              aria-label="Video progress"
              className="w-full min-w-0 border-0 bg-transparent p-0 accent-primary"
              disabled={!videoUrl}
              max="100"
              min="0"
              onChange={(event) => seek(event.target.value)}
              type="range"
              value={playbackProgress}
            />
          </div>
        </div>
      </div>

      <aside className="border border-border bg-card p-4 sm:p-5">
        <p className="font-mono text-sm text-muted-foreground">Course outline</p>
        <div className="mt-4 h-px w-full bg-primary" />
        <div className="mt-5 grid gap-5">
          {sections.map((section) => (
            <div key={section.id}>
              <h3 className="text-base sm:text-lg">{section.title}</h3>
              {section.quiz ? (
                <div className="mt-3">
                  <QuizPanel quiz={section.quiz} />
                </div>
              ) : null}
              {section.assignment ? (
                <div className="mt-3">
                  <AssignmentPanel assignment={section.assignment} />
                </div>
              ) : null}
              <div className="mt-3 grid gap-2">
                {section.lectures.map((lecture: LearningLectureDto) => (
                  <Button
                    className={`h-auto w-full justify-start border px-3 py-2 text-left text-sm ${
                      lecture.id === selectedLectureId
                        ? "border-primary text-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                    key={lecture.id}
                    onClick={() => selectLecture(lecture.id)}
                    type="button"
                  >
                    <span className="min-w-0 break-words">{lecture.title}</span>
                    {lectureProgress[lecture.id]?.isCompleted ? (
                      <span className="mt-1 block font-mono text-xs text-primary">
                        Complete
                      </span>
                    ) : lectureProgress[lecture.id]?.positionSeconds ? (
                      <span className="mt-1 block font-mono text-xs">
                        Resume {formatDuration(
                          lectureProgress[lecture.id]?.positionSeconds ?? 0,
                        )}
                      </span>
                    ) : null}
                    {lecture.durationSeconds ? (
                      <span className="mt-1 block font-mono text-xs">
                        {formatDuration(lecture.durationSeconds)}
                      </span>
                    ) : null}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
