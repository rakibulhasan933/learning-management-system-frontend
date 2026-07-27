"use client"

import { useRef, useState, useTransition } from "react"
import type { DragEvent } from "react"
import { CheckCircle2, ExternalLink, FileText, Loader2, Presentation, X } from "lucide-react"

import { uploadLectureMaterialAction } from "./actions"
import { cn } from "@workspace/ui/lib/utils"

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
    hint: "PDF only",
    title: "Lecture PDF",
    Icon: FileText,
  },
  slides: {
    accept:
      "application/pdf,.ppt,.pptx,.odp,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.oasis.opendocument.presentation",
    button: "Upload slides",
    hint: "PDF, PPT, or ODP",
    title: "Lecture slides",
    Icon: Presentation,
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
  const [fileName, setFileName] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, startTransition] = useTransition()
  const label = labels[kind]
  const Icon = label.Icon

  function uploadFile(file: File) {
    setFileName(file.name)
    setMessage(null)
    setIsError(false)

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
        setMessage("Uploaded")
      } catch (error) {
        setIsError(true)
        setMessage(error instanceof Error ? error.message : "Upload failed.")
      }
    })
  }

  function handleFileChange() {
    const file = inputRef.current?.files?.[0]
    if (!file) return
    uploadFile(file)
    if (inputRef.current) inputRef.current.value = ""
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (isPending) return
    const file = event.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  function clear() {
    setMaterialUrl(null)
    setFileName(null)
    setMessage(null)
    setIsError(false)
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-medium text-foreground">{label.title}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label.hint}
        </p>
      </div>

      {!materialUrl ? (
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isPending && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if ((event.key === "Enter" || event.key === " ") && !isPending) {
              inputRef.current?.click()
            }
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed border-border bg-background px-4 py-6 text-center transition-colors",
            "hover:border-primary/50",
            isDragging && "border-primary bg-primary/5",
            isPending && "cursor-not-allowed opacity-70",
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">
                Uploading {fileName}…
              </p>
            </>
          ) : (
            <>
              <Icon className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-foreground">
                Drop file, or{" "}
                <span className="text-primary underline underline-offset-2">
                  {label.button.toLowerCase()}
                </span>
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 border border-border bg-background p-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-secondary text-secondary">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">
              {fileName ?? label.title}
            </p>
            <a
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              href={materialUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open file
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <button
            type="button"
            onClick={clear}
            aria-label="Remove file"
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {message ? (
        <p
          className={cn(
            "text-xs",
            isError ? "text-destructive" : "text-muted-foreground",
          )}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <input
        ref={inputRef}
        accept={label.accept}
        className="hidden"
        onChange={handleFileChange}
        type="file"
      />
    </div>
  )
}