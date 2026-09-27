"use client"

import { useState } from "react"
import Image from "next/image"

import { UploadButton } from "@/lib/uploadthing"
import type { ImageUploadPurpose } from "@/lib/image-uploads"
import { buttonVariants } from "@workspace/ui/components/button"
import { ProgressThread } from "@workspace/ui/components/progress-thread"

interface ImageUploadControlProps {
  buttonLabel: string
  currentUrl?: string | null
  helpText: string
  inputName: string
  label: string
  maxBytes?: number
  purpose: ImageUploadPurpose
}

export function ImageUploadControl({
  buttonLabel,
  currentUrl,
  helpText,
  inputName,
  label,
  maxBytes = 4 * 1024 * 1024,
  purpose,
}: ImageUploadControlProps) {
  const [imageUrl, setImageUrl] = useState(currentUrl ?? "")
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-foreground">{label}</p>
          <p className="text-sm leading-6 text-muted-foreground">{helpText}</p>
        </div>
        <ProgressThread className="w-20" />
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-background ring-1 ring-foreground/10">
          {imageUrl ? (
            <Image
              alt={label}
              className="object-cover"
              fill
              sizes="220px"
              src={imageUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
              No image uploaded yet.
            </div>
          )}
        </div>

        <div className="grid content-start gap-3">
          <UploadButton
            className="w-fit"
            endpoint={
              purpose === "course_thumbnail"
                ? "courseThumbnailImage"
                : "avatarImage"
            }
            appearance={{
              allowedContent: "hidden",
              button: ({ isUploading, ready }) =>
                [
                  buttonVariants({ variant: "outline" }),
                  isUploading ? "opacity-60" : "",
                  ready ? "" : "opacity-70",
                ]
                  .filter(Boolean)
                  .join(" "),
              container: "w-fit",
            }}
            content={{
              button: ({ isUploading, ready }) =>
                isUploading ? "Uploading..." : ready ? buttonLabel : "Ready",
            }}
            onClientUploadComplete={(response) => {
              const uploadedUrl = response[0]?.url

              if (!uploadedUrl) {
                setMessage("Upload completed, but no URL was returned.")
                return
              }

              setImageUrl(uploadedUrl)
              setMessage("Image uploaded.")
            }}
            onUploadError={(error) => {
              setMessage(error.message)
            }}
          />
          <p className="text-sm leading-6 text-muted-foreground">
            {helpText}
          </p>
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
            JPG, PNG, or WEBP only. Max {Math.round(maxBytes / 1024 / 1024)} MB.
          </p>
          {message ? (
            <p className="text-sm text-muted-foreground" role="status">
              {message}
            </p>
          ) : null}
        </div>
      </div>

      <input name={inputName} readOnly type="hidden" value={imageUrl} />
    </div>
  )
}
