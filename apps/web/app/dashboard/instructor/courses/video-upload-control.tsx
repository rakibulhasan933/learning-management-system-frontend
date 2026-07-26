"use client"

import { useEffect, useRef, useState } from "react"
import type { ChangeEvent } from "react"

import { getBackendApiUrl } from "@/lib/auth/cookies"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

interface VideoUploadControlProps {
  courseId: string
  lectureId: string
}

type UploadPhase = "idle" | "uploading" | "paused" | "success" | "error"

function formatMegabytes(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1)
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

  useEffect(
    () => () => {
      xhrRef.current?.abort()
    },
    [],
  )

  useEffect(() => {
    if (phase === "success" && inputRef.current) {
      inputRef.current.value = ""
    }
  }, [phase])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.currentTarget.files?.[0] ?? null

    if (nextFile && nextFile.type !== "video/mp4") {
      setFile(null)
      setPhase("error")
      setMessage("Only MP4 videos are supported.")
      setUploadedBytes(0)
      setTotalBytes(0)
      event.currentTarget.value = ""
      return
    }

    setFile(nextFile)
    setPhase("idle")
    setMessage(
      nextFile
        ? `Ready to upload ${formatMegabytes(nextFile.size)} MB.`
        : null,
    )
    setUploadedBytes(0)
    setTotalBytes(0)
  }

  function abortUpload() {
    xhrRef.current?.abort()
  }

  function startUpload() {
    if (!file) {
      setPhase("error")
      setMessage("Choose an MP4 file first.")
      return
    }

    const uploadUrl = new URL(
      `${getBackendApiUrl()}/instructor/courses/${courseId}/lectures/${lectureId}/video-upload`,
    )
    uploadUrl.searchParams.set("fileName", file.name)

    const xhr = new XMLHttpRequest()
    xhrRef.current = xhr
    progressRef.current = {
      totalBytes: file.size,
      uploadedBytes: 0,
    }

    setPhase("uploading")
    setMessage("Uploading...")
    setUploadedBytes(0)
    setTotalBytes(file.size)

    xhr.open("POST", uploadUrl.toString())
    xhr.withCredentials = true
    xhr.setRequestHeader("Content-Type", "video/mp4")

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

    xhr.onload = () => {
      xhrRef.current = null

      if (xhr.status >= 200 && xhr.status < 300) {
        const successMessage = readUploadMessage(xhr) ?? "Video uploaded and saved."

        setPhase("success")
        setMessage(successMessage)
        setFile(null)
        setUploadedBytes(progressRef.current.totalBytes)
        setTotalBytes(progressRef.current.totalBytes)

        return
      }

      setPhase("error")
      setMessage(readUploadMessage(xhr) ?? "Video upload failed.")
    }

    xhr.onerror = () => {
      xhrRef.current = null
      setPhase("error")
      setMessage("Video upload failed.")
    }

    xhr.onabort = () => {
      xhrRef.current = null
      setPhase("paused")
      setMessage(
        `Upload paused at ${formatMegabytes(progressRef.current.uploadedBytes)} MB.`,
      )
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

  const primaryLabel =
    phase === "uploading"
      ? "Pause upload"
      : phase === "paused"
        ? "Resume upload"
        : "Upload video"

  const progressLabel =
    totalBytes > 0
      ? `${formatMegabytes(uploadedBytes)} MB of ${formatMegabytes(totalBytes)} MB uploaded`
      : uploadedBytes > 0
        ? `${formatMegabytes(uploadedBytes)} MB uploaded`
        : null

  return (
    <div className="grid gap-2 md:col-span-4">
      <label className="grid gap-2 text-sm text-muted-foreground">
        <span>Upload MP4 through backend</span>
        <Input
          ref={inputRef}
          accept="video/mp4"
          name="videoFile"
          onChange={handleFileChange}
          disabled={phase === "uploading"}
          type="file"
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Uploads are routed through the backend, then written to R2 server-side.
      </p>
      {progressLabel ? (
        <p className="text-xs text-muted-foreground" role="status">
          {progressLabel}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={!file && phase !== "uploading"}
          onClick={handlePrimaryAction}
          type="button"
          variant="outline"
        >
          {primaryLabel}
        </Button>
        {message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
