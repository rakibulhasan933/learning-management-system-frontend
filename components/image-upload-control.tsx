"use client"

import { useState } from "react"
import Image from "next/image"

import { UploadButton } from "@/lib/uploadthing"
import type { ImageUploadPurpose } from "@/lib/image-uploads"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageUploadLabels {
  empty: string
  uploading: string
  ready: string
  done: string
  noUrl: string
}

interface ImageUploadControlProps {
  buttonLabel: string
  currentUrl?: string | null
  helpText: string
  inputName: string
  label: string
  maxBytes?: number
  purpose: ImageUploadPurpose
  /** Optional translations. English is the default. */
  labels?: Partial<ImageUploadLabels>
  /** Shows the "JPG, PNG, or WEBP only. Max N MB." line. Hide it when helpText already says so. */
  showFormatHint?: boolean
}

const defaultLabels: ImageUploadLabels = {
  empty: "No image uploaded yet.",
  uploading: "Uploading...",
  ready: "Ready",
  done: "Image uploaded.",
  noUrl: "Upload completed, but no URL was returned.",
}

export function ImageUploadControl({
  buttonLabel,
  currentUrl,
  helpText,
  inputName,
  label,
  maxBytes = 4 * 1024 * 1024,
  purpose,
  labels,
  showFormatHint = true,
}: ImageUploadControlProps) {
  const [imageUrl, setImageUrl] = useState(currentUrl ?? "")
  const [message, setMessage] = useState<string | null>(null)
  const text = { ...defaultLabels, ...labels }
  const isAvatar = purpose === "avatar"

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div
        className={cn(
          "relative shrink-0 overflow-hidden border border-border bg-background",
          isAvatar
            ? "size-24 rounded-full"
            : "aspect-[16/10] w-full rounded-lg sm:w-56"
        )}
      >
        {imageUrl ? (
          <Image
            alt={label}
            className="object-cover"
            fill
            sizes={isAvatar ? "96px" : "224px"}
            src={imageUrl}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
            {text.empty}
          </div>
        )}
      </div>

      <div className="grid min-w-0 content-start gap-2">
        <UploadButton
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
            container: "w-fit items-start",
          }}
          className="w-fit"
          content={{
            button: ({ isUploading, ready }) =>
              isUploading ? text.uploading : ready ? buttonLabel : text.ready,
          }}
          endpoint={isAvatar ? "avatarImage" : "courseThumbnailImage"}
          onClientUploadComplete={(response) => {
            const uploadedUrl = response[0]?.url

            if (!uploadedUrl) {
              setMessage(text.noUrl)
              return
            }

            setImageUrl(uploadedUrl)
            setMessage(text.done)
          }}
          onUploadError={(error) => {
            setMessage(error.message)
          }}
        />
        <p className="text-sm text-muted-foreground">{helpText}</p>
        {showFormatHint ? (
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or WEBP only. Max {Math.round(maxBytes / 1024 / 1024)} MB.
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-foreground" role="status">
            {message}
          </p>
        ) : null}
      </div>

      <input name={inputName} readOnly type="hidden" value={imageUrl} />
    </div>
  )
}
