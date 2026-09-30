"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Pause, Play } from "lucide-react"
import type { CourseDetailDto } from "@/lib/types"

import { getLectureVideoUrlAction } from "@/app/learn/[courseId]/actions"

interface PreviewVideoPlayerProps {
  learnerEmail: string | null
  sections: CourseDetailDto["sections"]
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

export function PreviewVideoPlayer({
  learnerEmail,
  sections,
}: PreviewVideoPlayerProps) {
  const previewLectures = useMemo(
    () =>
      sections
        .flatMap((section) => section.lectures)
        .filter((lecture) => lecture.isPreview),
    [sections]
  )
  const [selectedLectureId, setSelectedLectureId] = useState(
    previewLectures[0]?.id ?? null
  )
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isPlaying, setIsPlaying] = useState(false)
  const [watermarkPosition, setWatermarkPosition] = useState({
    left: "50%",
    top: "50%",
  })
  const videoRef = useRef<HTMLVideoElement>(null)
  const selectedLecture = previewLectures.find(
    (lecture) => lecture.id === selectedLectureId
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
      } catch (error) {
        setVideoUrl(null)
        setMessage(
          error instanceof Error
            ? error.message
            : "Preview could not be loaded."
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
        8000 + Math.floor(Math.random() * 4000)
      )
    }

    timeoutId = setTimeout(() => {
      setWatermarkPosition(getWatermarkPosition())
      scheduleMove()
    }, 0)

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

  if (previewLectures.length === 0) {
    return null
  }

  return (
    <section className="mt-10 overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid gap-2 border-b border-border p-4">
        <p className="font-mono text-xs text-muted-foreground sm:text-sm">
          Free preview
        </p>
        <h2 className="font-heading text-xl sm:text-2xl">
          {selectedLecture?.title}
        </h2>
      </div>
      <div className="relative aspect-video bg-background">
        {videoUrl ? (
          <video
            ref={videoRef}
            className="h-full w-full object-contain"
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            playsInline
            preload="metadata"
            src={videoUrl}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Preparing preview...
              </>
            ) : (
              message
            )}
          </div>
        )}
        <div
          className="pointer-events-none absolute max-w-[72%] font-mono text-[11px] break-words text-foreground opacity-20 sm:text-sm"
          style={{
            left: watermarkPosition.left,
            top: watermarkPosition.top,
            transform: "translate(-50%, -50%)",
          }}
        >
          {learnerEmail ?? "free preview"}
        </div>
      </div>
      <div className="grid gap-3 border-t border-border p-4">
        <Button
          className="w-full sm:w-fit"
          disabled={!videoUrl || isPending}
          onClick={togglePlayback}
          type="button"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Preparing...
            </>
          ) : isPlaying ? (
            <>
              <Pause className="size-3.5" />
              Pause
            </>
          ) : (
            <>
              <Play className="size-3.5" />
              Play
            </>
          )}
        </Button>
        <div className="grid gap-2">
          {previewLectures.map((lecture) => (
            <Button
              className={`h-auto w-full justify-start rounded-xl border px-3 py-2 text-left text-sm ${
                lecture.id === selectedLectureId
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-background"
              }`}
              disabled={isPending}
              key={lecture.id}
              onClick={() => {
                setSelectedLectureId(lecture.id)
                setVideoUrl(null)
                setMessage(null)
                setIsPlaying(false)
              }}
              type="button"
              variant="ghost"
            >
              <span className="grid gap-1">
                <span className="truncate">{lecture.title}</span>
                {lecture.durationSeconds ? (
                  <span className="font-mono text-xs">
                    {formatDuration(lecture.durationSeconds)}
                  </span>
                ) : null}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  )
}
