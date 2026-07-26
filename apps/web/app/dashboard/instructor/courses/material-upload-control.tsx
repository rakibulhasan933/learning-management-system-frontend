"use client"

import { useRef, useState, useTransition } from "react"

import { uploadLectureMaterialAction } from "./actions"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

interface MaterialUploadControlProps {
  courseId: string
  kind: "pdf" | "slides"
  lectureId: string
  url: string | null
}

const labels = {
  pdf: {
    accept: "application/pdf",
    button: "Upload PDF",
    title: "Lecture PDF",
  },
  slides: {
    accept:
      "application/pdf,.ppt,.pptx,.odp,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.oasis.opendocument.presentation",
    button: "Upload slides",
    title: "Lecture slides",
  },
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener("error", () => reject(reader.error))
    reader.addEventListener("load", () => {
      const result = String(reader.result ?? "")
      const [, base64 = ""] = result.split(",")

      resolve(base64)
    })
    reader.readAsDataURL(file)
  })
}

export function MaterialUploadControl({
  courseId,
  kind,
  lectureId,
  url,
}: MaterialUploadControlProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [materialUrl, setMaterialUrl] = useState(url)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const label = labels[kind]

  function uploadSelectedFile() {
    const file = inputRef.current?.files?.[0]

    if (!file) {
      setMessage(`Choose a ${kind === "pdf" ? "PDF" : "slides"} file first.`)
      return
    }

    setMessage("Preparing upload...")
    startTransition(async () => {
      try {
        const response = await uploadLectureMaterialAction({
          base64: await fileToBase64(file),
          contentType: file.type || "application/octet-stream",
          courseId,
          fileName: file.name,
          kind,
          lectureId,
        })

        setMaterialUrl(response.url)
        setMessage("Uploaded.")
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Upload failed.")
      }
    })
  }

  return (
    <div className="grid gap-2">
      <label className="grid gap-2 text-sm text-muted-foreground">
        <span>{label.title}</span>
        <Input ref={inputRef} accept={label.accept} type="file" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={isPending}
          onClick={uploadSelectedFile}
          type="button"
          variant="outline"
        >
          {isPending ? "Uploading..." : label.button}
        </Button>
        {materialUrl ? (
          <a
            className="text-sm text-primary hover:underline"
            href={materialUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open file
          </a>
        ) : null}
        {message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
