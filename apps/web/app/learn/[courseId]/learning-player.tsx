"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import type { LearningCourseResponse, LearningLectureDto } from "@workspace/types"

import { getLectureVideoUrlAction } from "./actions"
import { QuizPanel } from "./quiz-panel"

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
  const [progress, setProgress] = useState(0)
  const [watermarkPosition, setWatermarkPosition] = useState(
    getWatermarkPosition,
  )
  const videoRef = useRef<HTMLVideoElement>(null)

  const selectedLecture = lectures.find(
    (lecture) => lecture.id === selectedLectureId,
  )

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
        setProgress(0)
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Video could not be loaded.",
        )
      }
    })
  }, [selectedLectureId])

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

  function handleTimeUpdate() {
    const video = videoRef.current

    if (!video?.duration) {
      return
    }

    setProgress((video.currentTime / video.duration) * 100)
  }

  function seek(value: string) {
    const video = videoRef.current

    if (!video?.duration) {
      return
    }

    const nextProgress = Number(value)
    video.currentTime = (nextProgress / 100) * video.duration
    setProgress(nextProgress)
  }

  function selectLecture(lectureId: string) {
    setSelectedLectureId(lectureId)
    setVideoUrl(null)
    setMessage(null)
    setIsPlaying(false)
    setProgress(0)
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="border border-border bg-card">
        <div className="relative aspect-video bg-background">
              {videoUrl ? (
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
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
            className="pointer-events-none absolute font-mono text-sm text-foreground opacity-20"
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
            <h2 className="mt-1 text-2xl">
              {selectedLecture?.title ?? "No published lectures"}
            </h2>
          </div>
          {selectedLecture?.quiz ? <QuizPanel quiz={selectedLecture.quiz} /> : null}
          {message && videoUrl ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}
          <div className="flex items-center gap-3">
            <button
              className="bg-primary px-4 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!videoUrl}
              onClick={togglePlayback}
              type="button"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <input
              aria-label="Video progress"
              className="w-full accent-primary"
              disabled={!videoUrl}
              max="100"
              min="0"
              onChange={(event) => seek(event.target.value)}
              type="range"
              value={progress}
            />
          </div>
        </div>
      </div>

      <aside className="border border-border bg-card p-5">
        <p className="font-mono text-sm text-muted-foreground">Course outline</p>
        <div className="mt-4 h-px w-full bg-primary" />
        <div className="mt-5 grid gap-5">
          {sections.map((section) => (
            <div key={section.id}>
              <h3 className="text-lg">{section.title}</h3>
              {section.quiz ? (
                <div className="mt-3">
                  <QuizPanel quiz={section.quiz} />
                </div>
              ) : null}
              <div className="mt-3 grid gap-2">
                {section.lectures.map((lecture: LearningLectureDto) => (
                  <button
                    className={`border px-3 py-2 text-left text-sm ${
                      lecture.id === selectedLectureId
                        ? "border-primary text-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                    key={lecture.id}
                    onClick={() => selectLecture(lecture.id)}
                    type="button"
                  >
                    <span>{lecture.title}</span>
                    {lecture.durationSeconds ? (
                      <span className="mt-1 block font-mono text-xs">
                        {formatDuration(lecture.durationSeconds)}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
