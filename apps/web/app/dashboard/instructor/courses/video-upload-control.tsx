"use client"

import { useRef, useState, useTransition } from "react"

import {
  requestLectureVideoUploadAction,
  saveLectureVideoRefAction,
} from "./actions"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

interface VideoUploadControlProps {
  courseId: string
  lectureId: string
}

export function VideoUploadControl({
  courseId,
  lectureId,
}: VideoUploadControlProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function uploadSelectedFile() {
    const file = inputRef.current?.files?.[0]

    if (!file) {
      setMessage("Choose an MP4 file first.")
      return
    }

    if (file.type !== "video/mp4") {
      setMessage("Only MP4 videos are supported.")
      return
    }

    setMessage("Preparing upload...")
    startTransition(async () => {
      try {
        const presign = await requestLectureVideoUploadAction({
          contentType: file.type,
          courseId,
          fileName: file.name,
          lectureId,
        })

        setMessage("Uploading to R2...")
        const uploadResponse = await fetch(presign.uploadUrl, {
          body: file,
          headers: presign.headers,
          method: "PUT",
        })

        if (!uploadResponse.ok) {
          throw new Error("R2 upload failed.")
        }

        await saveLectureVideoRefAction({
          courseId,
          lectureId,
          videoRef: presign.videoRef,
        })
        setMessage("Video uploaded and saved.")
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Video upload failed.")
      }
    })
  }

  return (
    <div className="grid gap-2 md:col-span-4">
      <label className="grid gap-2 text-sm text-muted-foreground">
        <span>Upload MP4 to R2</span>
        <Input ref={inputRef} accept="video/mp4" type="file" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={isPending}
          onClick={uploadSelectedFile}
          type="button"
          variant="outline"
        >
          {isPending ? "Uploading..." : "Upload video"}
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
