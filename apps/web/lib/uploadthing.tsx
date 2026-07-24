"use client"

import { generateUploadButton } from "@uploadthing/react"
import type { ComponentProps } from "react"

import type { UploadRouter } from "@/app/api/uploadthing/core"

const GeneratedUploadButton: ReturnType<
  typeof generateUploadButton<UploadRouter>
> = generateUploadButton<UploadRouter>()

type UploadButtonProps = ComponentProps<typeof GeneratedUploadButton>

export function UploadButton(props: UploadButtonProps) {
  return <GeneratedUploadButton {...props} />
}
