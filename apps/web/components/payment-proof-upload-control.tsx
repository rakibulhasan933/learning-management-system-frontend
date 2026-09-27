"use client"

import { useState } from "react"

import { UploadButton } from "@/lib/uploadthing"
import { buttonVariants } from "@workspace/ui/components/button"

interface PaymentProofUploadControlProps {
  currentUrl?: string | null
}

export function PaymentProofUploadControl({
  currentUrl,
}: PaymentProofUploadControlProps) {
  const [proofUrl, setProofUrl] = useState(currentUrl ?? "")
  const [message, setMessage] = useState<string | null>(
    currentUrl ? "Screenshot uploaded." : null,
  )

  return (
    <div className="grid gap-2 text-sm text-muted-foreground">
      <span>Screenshot</span>
      <div className="grid gap-3">
        <UploadButton
          className="w-fit"
          endpoint="paymentProofScreenshotImage"
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
              isUploading ? "Uploading..." : ready ? "Upload screenshot" : "Ready",
          }}
          onClientUploadComplete={(response) => {
            const uploadedUrl = response[0]?.url

            if (!uploadedUrl) {
              setMessage("Upload completed, but no URL was returned.")
              return
            }

            setProofUrl(uploadedUrl)
            setMessage("Screenshot uploaded.")
          }}
          onUploadError={(error) => {
            setMessage(error.message)
          }}
        />
        {message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </div>
      <input name="proofScreenshot" readOnly type="hidden" value={proofUrl} />
    </div>
  )
}
