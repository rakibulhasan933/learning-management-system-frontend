"use client"

import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, DragEvent } from "react"
import { CheckCircle2, FileVideo, Loader2, Pause, Play, X } from "lucide-react"
import { toast } from "sonner"

import { getBackendApiUrl } from "@/lib/auth/cookies"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  requestModuleVideoUploadAction,
  updateInstructorVideoAfterUploadAction,
} from "./actions"

interface VideoUploadControlProps {
  courseId: string
  lectureId: string
  videoId?: string
}

type UploadPhase = "idle" | "uploading" | "paused" | "success" | "error"

function formatMegabytes(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1)
}

function readVideoMetadata(file: File) {
  return new Promise<{ durationSeconds: number | null; title: string }>(
    (resolve) => {
      const title = file.name || "Video"
      const objectUrl = URL.createObjectURL(file)
      const element = document.createElement("video")
      element.preload = "metadata"
      element.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl)
        resolve({
          durationSeconds: Number.isFinite(element.duration)
            ? Math.max(0, Math.round(element.duration))
            : null,
          title,
        })
      }
      element.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        resolve({ durationSeconds: null, title })
      }
      element.src = objectUrl
    }
  )
}

function readUploadMessage(xhr: XMLHttpRequest) {
  try {
    const payload = JSON.parse(xhr.responseText) as { message?: string } | null
    return payload?.message ?? null
  } catch {
    return null
  }
}

export function VideoUploadControl({
  courseId,
  lectureId,
  videoId,
}: VideoUploadControlProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const progressRef = useRef({
    totalBytes: 0,
    uploadedBytes: 0,
  })
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<UploadPhase>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [uploadedBytes, setUploadedBytes] = useState(0)
  const [totalBytes, setTotalBytes] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(
    () => () => {
      xhrRef.current?.abort()
    },
    []
  )

  useEffect(() => {
    if (phase === "success" && inputRef.current) {
      inputRef.current.value = ""
    }
  }, [phase])

  function acceptFile(nextFile: File | null) {
    if (nextFile && nextFile.type !== "video/mp4") {
      setFile(null)
      setPhase("error")
      setMessage("Only MP4 videos are supported.")
      setUploadedBytes(0)
      setTotalBytes(0)
      return
    }

    setFile(nextFile)
    setPhase("idle")
    setMessage(null)
    setUploadedBytes(0)
    setTotalBytes(0)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.currentTarget.files?.[0] ?? null)
    event.currentTarget.value = ""
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (phase === "uploading") return
    acceptFile(event.dataTransfer.files?.[0] ?? null)
  }

  function abortUpload() {
    xhrRef.current?.abort()
  }

  async function startUpload() {
    if (!file) {
      setPhase("error")
      setMessage("Choose an MP4 file first.")
      return
    }

    let uploadUrl = new URL(
      `${getBackendApiUrl()}/instructor/courses/${courseId}/${videoId ? `videos/${videoId}` : `lectures/${lectureId}`}/video-upload`
    )
    uploadUrl.searchParams.set("fileName", file.name)
    let uploadMethod = "POST"
    let uploadHeaders: Record<string, string> = {
      "Content-Type": "video/mp4",
    }
    let presignedVideoRef: string | null = null

    if (videoId) {
      try {
        const presign = await requestModuleVideoUploadAction({
          contentType: "video/mp4",
          courseId,
          fileName: file.name,
          videoId,
        })
        uploadUrl = new URL(presign.uploadUrl)
        uploadMethod = "PUT"
        uploadHeaders = presign.headers
        presignedVideoRef = presign.videoRef
      } catch (error) {
        setPhase("error")
        setMessage(
          error instanceof Error ? error.message : "Could not prepare upload."
        )
        return
      }
    }

    const xhr = new XMLHttpRequest()
    xhrRef.current = xhr

    setPhase("uploading")
    setMessage(null)
    setUploadedBytes(0)
    setTotalBytes(file.size)
    progressRef.current = { totalBytes: file.size, uploadedBytes: 0 }

    xhr.open(uploadMethod, uploadUrl.toString())
    xhr.withCredentials = !videoId
    Object.entries(uploadHeaders).forEach(([name, value]) => {
      xhr.setRequestHeader(name, value)
    })
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        progressRef.current = {
          totalBytes: event.total,
          uploadedBytes: event.loaded,
        }
        setUploadedBytes(event.loaded)
        setTotalBytes(event.total)
      }
    }
    xhr.onload = async () => {
      xhrRef.current = null
      if (xhr.status >= 200 && xhr.status < 300) {
        if (videoId) {
          const metadata = await readVideoMetadata(file)
          try {
            if (presignedVideoRef) {
              await updateInstructorVideoAfterUploadAction({
                ...metadata,
                courseId,
                videoId,
                videoRef: presignedVideoRef,
              })
            }
          } catch {
            // The upload is already complete; metadata can be edited later if detection fails.
          }
        }
        setPhase("success")
        setMessage(readUploadMessage(xhr) ?? "Video uploaded and saved.")
        setUploadedBytes(file.size)
        setTotalBytes(file.size)
        toast.success("Video upload complete", {
          description: `${file.name} is ready to use in this module.`,
        })
      } else {
        setPhase("error")
        setMessage(
          readUploadMessage(xhr) ?? `Video upload failed (${xhr.status}).`
        )
        toast.error("Video upload failed")
      }
    }
    xhr.onerror = () => {
      xhrRef.current = null

      // R2 rejects browser preflight when bucket CORS is not configured.
      // Keep the upload usable by falling back to the authenticated backend
      // stream; the direct signed upload remains the preferred path.
      if (videoId) {
        const fallbackUrl = new URL(
          `${getBackendApiUrl()}/instructor/courses/${courseId}/videos/${videoId}/video-upload`
        )
        fallbackUrl.searchParams.set("fileName", file.name)
        const fallbackXhr = new XMLHttpRequest()
        xhrRef.current = fallbackXhr
        fallbackXhr.open("POST", fallbackUrl.toString())
        fallbackXhr.withCredentials = true
        fallbackXhr.setRequestHeader("Content-Type", "video/mp4")
        fallbackXhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadedBytes(event.loaded)
            setTotalBytes(event.total)
          }
        }
        fallbackXhr.onload = () => {
          xhrRef.current = null
          if (fallbackXhr.status >= 200 && fallbackXhr.status < 300) {
            setPhase("success")
            setMessage("Video uploaded and saved.")
            setUploadedBytes(file.size)
            setTotalBytes(file.size)
            toast.success("Video upload complete", {
              description: `${file.name} was uploaded through the secure fallback path.`,
            })
          } else {
            setPhase("error")
            setMessage(
              readUploadMessage(fallbackXhr) ??
                `Video upload failed (${fallbackXhr.status}).`
            )
            toast.error("Video upload failed")
          }
        }
        fallbackXhr.onerror = () => {
          xhrRef.current = null
          setPhase("error")
          setMessage("Video upload failed. Check backend/R2 configuration.")
          toast.error("Video upload failed", {
            description: "Check the backend and R2 configuration.",
          })
        }
        fallbackXhr.onabort = () => {
          xhrRef.current = null
          setPhase("paused")
        }
        fallbackXhr.send(file)
        return
      }

      setPhase("error")
      setMessage("Video upload failed. Check backend/R2 configuration.")
      toast.error("Video upload failed", {
        description: "Check the storage configuration and try again.",
      })
    }
    xhr.onabort = () => {
      xhrRef.current = null
      setPhase("paused")
      setMessage(null)
    }
    xhr.send(file)
  }

  function handlePrimaryAction() {
    if (phase === "uploading") {
      abortUpload()
      return
    }

    startUpload()
  }

  function clearFile() {
    if (phase === "uploading") abortUpload()
    setFile(null)
    setPhase("idle")
    setMessage(null)
    setUploadedBytes(0)
    setTotalBytes(0)
  }

  const percent =
    totalBytes > 0
      ? Math.min(100, Math.round((uploadedBytes / totalBytes) * 100))
      : 0

  const primaryLabel =
    phase === "uploading"
      ? "Pause"
      : phase === "paused"
        ? "Resume"
        : "Start upload"

  return (
    <div className="grid gap-3 md:col-span-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-medium text-foreground">Module video</p>
        <p className="font-mono text-[10px] tracking-wide text-muted-foreground">
          MP4 only
        </p>
      </div>

      {!file ? (
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              inputRef.current?.click()
            }
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border bg-background px-6 py-10 text-center transition-colors",
            "hover:border-primary/50",
            isDragging && "border-primary bg-primary/5"
          )}
        >
          <FileVideo className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-foreground">
            Drag and drop an MP4, or{" "}
            <span className="text-primary underline underline-offset-2">
              browse
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Uploaded directly to secure storage with live progress.
          </p>
        </div>
      ) : (
        <div className="border border-border bg-background p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center border",
                  phase === "success"
                    ? "border-secondary text-secondary"
                    : phase === "error"
                      ? "border-destructive text-destructive"
                      : "border-primary/50 text-primary"
                )}
              >
                {phase === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : phase === "uploading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileVideo className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{file.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatMegabytes(file.size)} MB
                </p>
              </div>
            </div>

            {phase !== "uploading" && phase !== "success" ? (
              <Button
                aria-label="Remove file"
                className="text-muted-foreground hover:text-destructive"
                onClick={clearFile}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>

          {(phase === "uploading" ||
            phase === "paused" ||
            phase === "success") && (
            <div className="mt-4">
              <div className="h-1.5 w-full overflow-hidden bg-border">
                <div
                  className={cn(
                    "h-full transition-all duration-200",
                    phase === "success" ? "bg-secondary" : "bg-primary"
                  )}
                  style={{ width: `${phase === "success" ? 100 : percent}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                <span>
                  {formatMegabytes(uploadedBytes)} MB /{" "}
                  {formatMegabytes(totalBytes)} MB
                </span>
                <span>{phase === "success" ? 100 : percent}%</span>
              </div>
            </div>
          )}

          {message ? (
            <p
              className={cn(
                "mt-3 text-xs",
                phase === "error" ? "text-destructive" : "text-muted-foreground"
              )}
              role="status"
            >
              {message}
            </p>
          ) : null}

          {phase !== "success" ? (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={handlePrimaryAction}
                size="sm"
                type="button"
                variant="outline"
                className="gap-2"
              >
                {phase === "uploading" ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                {primaryLabel}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <input
        ref={inputRef}
        accept="video/mp4"
        className="hidden"
        name="videoFile"
        onChange={handleFileChange}
        type="file"
      />
    </div>
  )
}
