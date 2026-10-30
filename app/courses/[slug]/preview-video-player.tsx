"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
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
  if (!seconds) return ""
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`.replace(
    /[0-9]/g,
    (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]
  )
}

export function PreviewVideoPlayer({
  learnerEmail,
  sections,
}: PreviewVideoPlayerProps) {
  const previewLectures = useMemo(
    () =>
      sections
        .flatMap((section) => section.lectures ?? [])
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
    if (!selectedLectureId) return

    startTransition(async () => {
      try {
        const response = await getLectureVideoUrlAction(selectedLectureId)
        setVideoUrl(response.url)
        setMessage(null)
        setIsPlaying(false)
      } catch (error) {
        setVideoUrl(null)
        setMessage(
          error instanceof Error ? error.message : "প্রিভিউ লোড করা যায়নি।"
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
    if (!video) return

    if (video.paused) {
      void video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  if (previewLectures.length === 0) return null

  return (
    <section className="mt-12 overflow-hidden rounded-xl border border-[#343943] bg-[#1B1F29]">
      <div className="border-b border-[#343943] p-4 sm:px-6">
        <p className="text-sm text-[#7FB8A8]">ফ্রি প্রিভিউ</p>
        <h2 className="text-xl leading-[1.5] font-semibold sm:text-2xl">
          {selectedLecture?.title}
        </h2>
      </div>

      <div className="relative aspect-video bg-[#0B0D12]">
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
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[#A3A5AE]">
            {isPending ? (
              <>
                <Loader2
                  aria-hidden
                  className="size-5 animate-spin text-[#C9A15A]"
                />
                প্রিভিউ তৈরি হচ্ছে...
              </>
            ) : (
              message
            )}
          </div>
        )}
        <div
          className="pointer-events-none absolute max-w-[72%] text-[11px] break-words text-white opacity-20 sm:text-sm"
          style={{
            left: watermarkPosition.left,
            top: watermarkPosition.top,
            transform: "translate(-50%, -50%)",
          }}
        >
          {learnerEmail ?? "free preview"}
        </div>
      </div>

      <div className="grid gap-4 border-t border-[#343943] p-4 sm:px-6">
        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#C9A15A] px-5 font-semibold text-[#12151C] transition-colors hover:bg-[#A88A4A] disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit"
          disabled={!videoUrl || isPending}
          onClick={togglePlayback}
          type="button"
        >
          {isPending ? (
            <>
              <Loader2 aria-hidden className="size-4 animate-spin" />
              তৈরি হচ্ছে...
            </>
          ) : isPlaying ? (
            <>
              <Pause aria-hidden className="size-4" />
              থামান
            </>
          ) : (
            <>
              <Play aria-hidden className="size-4" />
              চালান
            </>
          )}
        </button>

        {previewLectures.length > 1 ? (
          <ul className="grid gap-2">
            {previewLectures.map((lecture) => {
              const active = lecture.id === selectedLectureId
              return (
                <li key={lecture.id}>
                  <button
                    aria-pressed={active}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left text-[0.95rem] transition-colors disabled:cursor-not-allowed ${
                      active
                        ? "border-[#C9A15A] bg-[#C9A15A]/10 text-[#F2EFE7]"
                        : "border-[#343943] text-[#A3A5AE] hover:border-[#C9A15A]"
                    }`}
                    disabled={isPending}
                    onClick={() => {
                      setSelectedLectureId(lecture.id)
                      setVideoUrl(null)
                      setMessage(null)
                      setIsPlaying(false)
                    }}
                    type="button"
                  >
                    <span className="truncate">{lecture.title}</span>
                    {lecture.durationSeconds ? (
                      <span className="shrink-0 text-sm">
                        {formatDuration(lecture.durationSeconds)}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
