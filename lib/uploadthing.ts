"use client"

import { generateUploadButton } from "@uploadthing/react"

import type { UploadRouter } from "@/app/api/uploadthing/core"

export type OurFileRouter = UploadRouter

export const UploadButton = generateUploadButton<UploadRouter>({
  url: "/api/uploadthing",
})
