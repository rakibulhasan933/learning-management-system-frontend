"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent, RefObject } from "react"
import {
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
const SKIP_SECONDS = 10
const CONTROLS_IDLE_MS = 2600

interface LecturePlayerProps {
  /** Shown in the empty frame when there is no video to play. */
  emptyMessage: string
  isLoading: boolean
  onEnded: () => void
  onLoadedMetadata: () => void
  onPause: () => void
  onPlay: () => void
  onTimeUpdate: () => void
  src: string | null
  /** Owned by the parent so it can read/seek the element for progress saving. */
  videoRef: RefObject<HTMLVideoElement | null>
  watermarkPosition: { left: string; top: string }
  watermarkText: string
}

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00"
  }

  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const paddedSecs = secs.toString().padStart(2, "0")

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${paddedSecs}`
  }

  return `${minutes}:${paddedSecs}`
}

export function LecturePlayer({
  emptyMessage,
  isLoading,
  onEnded,
  onLoadedMetadata,
  onPause,
  onPlay,
  onTimeUpdate,
  src,
  videoRef,
  watermarkPosition,
  watermarkText,
}: LecturePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const seekBarRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedEnd, setBufferedEnd] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [activityTick, setActivityTick] = useState(0)
  const [renderedSrc, setRenderedSrc] = useState(src)

  const percent =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  const bufferedPercent =
    duration > 0 ? Math.min(100, (bufferedEnd / duration) * 100) : 0

  // Controls stay put while paused, scrubbing, or when there is nothing playing —
  // hiding them then just makes the player feel broken.
  const keepControlsOpen = !isPlaying || isScrubbing || !src
  const showControls = keepControlsOpen || controlsVisible

  // Bumped by every pointer/key interaction so the idle effect below restarts.
  const revealControls = useCallback(() => {
    setControlsVisible(true)
    setActivityTick((tick) => tick + 1)
  }, [])

  useEffect(() => {
    if (keepControlsOpen) {
      return
    }

    const timerId = setTimeout(
      () => setControlsVisible(false),
      CONTROLS_IDLE_MS
    )

    return () => clearTimeout(timerId)
  }, [activityTick, keepControlsOpen])

  // A new lecture reuses the same <video> element, so reset the frame-local UI.
  // Adjusting during render (rather than in an effect) avoids painting the
  // previous lecture's timeline against the new source for a frame. The chosen
  // playback rate deliberately survives, and is re-applied on loadedmetadata.
  if (renderedSrc !== src) {
    setRenderedSrc(src)
    setCurrentTime(0)
    setDuration(0)
    setBufferedEnd(0)
    setIsPlaying(false)
    setIsBuffering(false)
    setControlsVisible(true)
  }

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  function withVideo(action: (video: HTMLVideoElement) => void) {
    const video = videoRef.current

    if (video) {
      action(video)
    }
  }

  function togglePlayback() {
    withVideo((video) => {
      if (video.paused) {
        void video.play()
      } else {
        video.pause()
      }
    })
  }

  function skip(seconds: number) {
    withVideo((video) => {
      if (!Number.isFinite(video.duration)) {
        return
      }

      video.currentTime = Math.min(
        Math.max(0, video.currentTime + seconds),
        video.duration
      )
    })
    revealControls()
  }

  function seekToRatio(ratio: number) {
    withVideo((video) => {
      if (!Number.isFinite(video.duration) || video.duration === 0) {
        return
      }

      const nextTime = Math.min(Math.max(0, ratio), 1) * video.duration
      video.currentTime = nextTime
      setCurrentTime(nextTime)
    })
  }

  function ratioFromPointer(event: { clientX: number }) {
    const bar = seekBarRef.current

    if (!bar) {
      return 0
    }

    const bounds = bar.getBoundingClientRect()

    return bounds.width === 0 ? 0 : (event.clientX - bounds.left) / bounds.width
  }

  function handleSeekPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!src) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    setIsScrubbing(true)
    seekToRatio(ratioFromPointer(event))
  }

  function handleSeekPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isScrubbing) {
      return
    }

    seekToRatio(ratioFromPointer(event))
  }

  function handleSeekPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isScrubbing) {
      return
    }

    event.currentTarget.releasePointerCapture(event.pointerId)
    setIsScrubbing(false)
  }

  function handleSeekKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      skip(-5)
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      skip(5)
    } else if (event.key === "Home") {
      event.preventDefault()
      seekToRatio(0)
    } else if (event.key === "End") {
      event.preventDefault()
      seekToRatio(1)
    }
  }

  function applyVolume(nextVolume: number) {
    const clamped = Math.min(1, Math.max(0, nextVolume))

    withVideo((video) => {
      video.volume = clamped
      video.muted = clamped === 0
    })
    setVolume(clamped)
    setIsMuted(clamped === 0)
  }

  function toggleMute() {
    withVideo((video) => {
      const nextMuted = !video.muted
      video.muted = nextMuted
      setIsMuted(nextMuted)

      if (!nextMuted && video.volume === 0) {
        video.volume = 0.5
        setVolume(0.5)
      }
    })
  }

  function applyPlaybackRate(rate: number) {
    withVideo((video) => {
      video.playbackRate = rate
    })
    setPlaybackRate(rate)
  }

  function toggleFullscreen() {
    const container = containerRef.current

    if (!container) {
      return
    }

    if (document.fullscreenElement === container) {
      void document.exitFullscreen()
    } else {
      void container.requestFullscreen().catch(() => {
        // Fullscreen can be blocked by permissions policy; the player still works.
      })
    }
  }

  function handleContainerKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    // Let the seek bar and menus own their own keys.
    if (event.target !== event.currentTarget) {
      return
    }

    if (event.key === " " || event.key === "k") {
      event.preventDefault()
      togglePlayback()
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      skip(-SKIP_SECONDS)
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      skip(SKIP_SECONDS)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      applyVolume(volume + 0.1)
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      applyVolume(volume - 0.1)
    } else if (event.key === "m") {
      event.preventDefault()
      toggleMute()
    } else if (event.key === "f") {
      event.preventDefault()
      toggleFullscreen()
    }

    revealControls()
  }

  function syncBuffered(video: HTMLVideoElement) {
    if (video.buffered.length === 0) {
      return
    }

    setBufferedEnd(video.buffered.end(video.buffered.length - 1))
  }

  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div
      ref={containerRef}
      className={cn(
        "group/player relative aspect-video w-full bg-background outline-none",
        isFullscreen && "aspect-auto h-screen",
        !showControls && "cursor-none"
      )}
      onBlur={() => setControlsVisible(true)}
      onKeyDown={handleContainerKeyDown}
      onMouseLeave={() => {
        if (!keepControlsOpen) {
          setControlsVisible(false)
        }
      }}
      onMouseMove={revealControls}
      onPointerDown={revealControls}
      tabIndex={src ? 0 : -1}
    >
      {src ? (
        <video
          ref={videoRef}
          className="h-full w-full cursor-pointer object-contain"
          onCanPlay={() => setIsBuffering(false)}
          onClick={togglePlayback}
          onDurationChange={(event) => {
            const value = event.currentTarget.duration
            setDuration(Number.isFinite(value) ? value : 0)
          }}
          onEnded={() => {
            setIsPlaying(false)
            onEnded()
          }}
          onLoadedMetadata={(event) => {
            const value = event.currentTarget.duration
            setDuration(Number.isFinite(value) ? value : 0)
            event.currentTarget.playbackRate = playbackRate
            onLoadedMetadata()
          }}
          onPause={() => {
            setIsPlaying(false)
            onPause()
          }}
          onPlay={() => {
            setIsPlaying(true)
            onPlay()
          }}
          onPlaying={() => setIsBuffering(false)}
          onProgress={(event) => syncBuffered(event.currentTarget)}
          onTimeUpdate={(event) => {
            if (!isScrubbing) {
              setCurrentTime(event.currentTarget.currentTime)
            }
            syncBuffered(event.currentTarget)
            onTimeUpdate()
          }}
          onVolumeChange={(event) => {
            setVolume(event.currentTarget.volume)
            setIsMuted(event.currentTarget.muted)
          }}
          onWaiting={() => setIsBuffering(true)}
          playsInline
          preload="metadata"
          src={src}
        />
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-primary" />
              Preparing video...
            </span>
          ) : (
            emptyMessage
          )}
        </div>
      )}

      {/* Buffering indicator */}
      {src && isBuffering ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-background/70">
            <Loader2 className="size-7 animate-spin text-primary" />
          </span>
        </div>
      ) : null}

      {/* Centre play affordance while paused */}
      {src && !isPlaying && !isBuffering ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-background/70 ring-1 ring-primary/40">
            <Play className="size-7 translate-x-0.5 text-primary" />
          </span>
        </div>
      ) : null}

      {/*
        Required anti-piracy watermark: the learner's email at low opacity,
        repositioned by the parent every 8-12s. Do not remove or weaken.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute z-30 max-w-[72%] rounded-md bg-background/35 px-2 py-1 font-mono text-[11px] break-words text-foreground ring-1 ring-foreground/10 transition-[left,top] duration-500 select-none sm:text-sm"
        style={{
          left: watermarkPosition.left,
          opacity: 0.2,
          top: watermarkPosition.top,
          transform: "translate(-50%, -50%)",
          zIndex: 30,
        }}
      >
        {watermarkText}
      </div>

      {/* Control bar */}
      {src ? (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 bg-background/85 px-3 pt-2.5 pb-2 transition-opacity duration-200 sm:px-4",
            showControls ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          {/* Seek bar — the progress thread motif, thickened for touch. */}
          <div
            ref={seekBarRef}
            aria-label="Seek"
            aria-valuemax={Math.round(duration)}
            aria-valuemin={0}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatClock(currentTime)} of ${formatClock(duration)}`}
            className="group/seek relative flex h-5 w-full cursor-pointer touch-none items-center outline-none"
            onKeyDown={handleSeekKeyDown}
            onPointerCancel={handleSeekPointerUp}
            onPointerDown={handleSeekPointerDown}
            onPointerMove={handleSeekPointerMove}
            onPointerUp={handleSeekPointerUp}
            role="slider"
            tabIndex={0}
          >
            <div
              className={cn(
                "relative w-full overflow-hidden bg-foreground/15 transition-[height] duration-150",
                isScrubbing ? "h-[5px]" : "h-px group-hover/seek:h-[5px]"
              )}
            >
              <div
                className="absolute inset-y-0 left-0 bg-foreground/25"
                style={{ width: `${bufferedPercent}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-primary"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span
              className={cn(
                "pointer-events-none absolute size-3 -translate-x-1/2 rounded-full bg-primary transition-opacity duration-150",
                isScrubbing
                  ? "opacity-100"
                  : "opacity-0 group-hover/seek:opacity-100 group-focus-visible/seek:opacity-100"
              )}
              style={{ left: `${percent}%` }}
            />
          </div>

          <div className="mt-1 flex items-center gap-0.5 sm:gap-1">
            <Button
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={togglePlayback}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              {isPlaying ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
            </Button>
            <Button
              aria-label={`Back ${SKIP_SECONDS} seconds`}
              className="hidden sm:inline-flex"
              onClick={() => skip(-SKIP_SECONDS)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              aria-label={`Forward ${SKIP_SECONDS} seconds`}
              className="hidden sm:inline-flex"
              onClick={() => skip(SKIP_SECONDS)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <RotateCw className="size-4" />
            </Button>

            {/* Volume: icon toggles mute, slider appears on hover from sm up. */}
            <div className="group/volume flex items-center">
              <Button
                aria-label={isMuted ? "Unmute" : "Mute"}
                onClick={toggleMute}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <VolumeIcon className="size-4" />
              </Button>
              <input
                aria-label="Volume"
                className="ml-1 hidden h-1 w-0 cursor-pointer accent-primary transition-[width] duration-200 group-hover/volume:w-16 focus-visible:w-16 sm:block"
                max={1}
                min={0}
                onChange={(event) => applyVolume(Number(event.target.value))}
                step={0.05}
                type="range"
                value={isMuted ? 0 : volume}
              />
            </div>

            <p className="ml-1.5 font-mono text-[11px] text-muted-foreground tabular-nums sm:text-xs">
              <span className="text-foreground">
                {formatClock(currentTime)}
              </span>
              {" / "}
              {formatClock(duration)}
            </p>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      aria-label="Playback speed"
                      className="font-mono text-[11px] tabular-nums sm:text-xs"
                      size="sm"
                      type="button"
                      variant="ghost"
                    />
                  }
                >
                  {playbackRate}×
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-28"
                  side="top"
                >
                  <DropdownMenuRadioGroup
                    onValueChange={(value) => applyPlaybackRate(Number(value))}
                    value={String(playbackRate)}
                  >
                    {PLAYBACK_RATES.map((rate) => (
                      <DropdownMenuRadioItem key={rate} value={String(rate)}>
                        <span className="font-mono tabular-nums">
                          {rate === 1 ? "Normal" : `${rate}×`}
                        </span>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                onClick={toggleFullscreen}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                {isFullscreen ? (
                  <Minimize className="size-4" />
                ) : (
                  <Maximize className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
