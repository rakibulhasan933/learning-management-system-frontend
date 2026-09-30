"use client"

import { useRef, useState, useTransition } from "react"
import type { DragEvent } from "react"
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Presentation,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { getBackendApiUrl } from "@/lib/auth/cookies"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  completeModuleMaterialUploadAction,
  requestModuleMaterialUploadAction,
} from "./actions"

interface MaterialUploadControlProps {
  courseId: string
  kind: "pdf" | "slides"
  lectureId: string
  videoId?: string
  moduleId?: string
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

export function MaterialUploadControl({
  courseId,
  kind,
  lectureId,
  videoId,
  moduleId,
  url,
}: MaterialUploadControlProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [materialUrl, setMaterialUrl] = useState(url)
  const [fileName, setFileName] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [uploadProgress, setUploadProgress] = useState(0)
  const label = labels[kind]
  const Icon = label.Icon

  function uploadFile(file: File) {
    setFileName(file.name)
    setMessage(null)
    setIsError(false)
    setUploadProgress(0)

    startTransition(async () => {
      try {
        if (moduleId) {
          const presign = await requestModuleMaterialUploadAction({
            contentType: file.type || "application/octet-stream",
            courseId,
            fileName: file.name,
            kind,
            moduleId,
          })

          setUploadProgress(0)
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open("PUT", presign.uploadUrl)
            Object.entries(presign.headers).forEach(([name, value]) => {
              xhr.setRequestHeader(name, value)
            })
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                setUploadProgress(
                  Math.min(100, Math.round((event.loaded / event.total) * 100))
                )
              }
            }
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve()
              else reject(new Error(`Storage upload failed (${xhr.status}).`))
            }
            xhr.onerror = () => reject(new Error("Storage upload failed."))
            xhr.send(file)
          })

          await completeModuleMaterialUploadAction({
            courseId,
            kind,
            moduleId,
            url: presign.publicUrl,
          })

          setMaterialUrl(presign.publicUrl)
          setUploadProgress(100)
          setMessage("Uploaded")
          toast.success("File upload complete", {
            description: `${file.name} is ready to use in this module.`,
          })
          return
        }

        const resourcePath = moduleId
          ? `modules/${moduleId}`
          : videoId
            ? `videos/${videoId}`
            : `lectures/${lectureId}`
        const query = new URLSearchParams({ fileName: file.name, kind })
        const response = await new Promise<{ url: string }>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open(
              "POST",
              `${getBackendApiUrl()}/instructor/courses/${courseId}/${resourcePath}/material-upload?${query.toString()}`
            )
            xhr.withCredentials = true
            xhr.setRequestHeader(
              "Content-Type",
              file.type || "application/octet-stream"
            )
            xhr.onload = () => {
              try {
                const payload = JSON.parse(xhr.responseText) as {
                  message?: string
                  url?: string
                }
                if (xhr.status >= 200 && xhr.status < 300 && payload.url)
                  resolve({ url: payload.url })
                else
                  reject(
                    new Error(
                      payload.message ??
                        `Material upload failed (${xhr.status}).`
                    )
                  )
              } catch {
                reject(new Error(`Material upload failed (${xhr.status}).`))
              }
            }
            xhr.onerror = () =>
              reject(
                new Error(
                  "Material upload failed. Check the backend connection."
                )
              )
            xhr.send(file)
          }
        )

        setMaterialUrl(response.url)
        setMessage("Uploaded")
        toast.success("File upload complete")
      } catch (error) {
        setIsError(true)
        setMessage(error instanceof Error ? error.message : "Upload failed.")
        toast.error("File upload failed", {
          description: error instanceof Error ? error.message : undefined,
        })
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
    if (!moduleId) {
      setMaterialUrl(null)
      setFileName(null)
      setMessage(null)
      setIsError(false)
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch(
          `${getBackendApiUrl()}/instructor/courses/${courseId}/modules/${moduleId}/material`,
          {
            credentials: "include",
            method: "DELETE",
          }
        )
        if (!response.ok) throw new Error("Material could not be deleted.")
        setMaterialUrl(null)
        setFileName(null)
        setMessage("Deleted")
        setIsError(false)
      } catch (error) {
        setIsError(true)
        setMessage(error instanceof Error ? error.message : "Delete failed.")
      }
    })
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-medium text-foreground">{label.title}</p>
        <p className="font-mono text-[10px] tracking-wide text-muted-foreground">
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
            isPending && "cursor-not-allowed opacity-70"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">
                Uploading {fileName}…
              </p>
              <div className="mt-1 h-1.5 w-full max-w-xs overflow-hidden bg-border">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                {uploadProgress}%
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
              className="interactive-link inline-flex items-center gap-1 text-xs text-primary"
              href={materialUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open file
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <Button
            aria-label="Remove file"
            className="text-muted-foreground hover:text-destructive"
            disabled={isPending}
            onClick={clear}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {message ? (
        <p
          className={cn(
            "text-xs",
            isError ? "text-destructive" : "text-muted-foreground"
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
