import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

import { getBackendApiUrl } from "@/lib/api-client"

const f = createUploadthing()

async function getAuthenticatedProfile(req: Request) {
  const response = await fetch(`${getBackendApiUrl()}/auth/me`, {
    headers: {
      Accept: "application/json",
      Cookie: req.headers.get("cookie") ?? "",
    },
    method: "GET",
  })

  if (!response.ok) {
    throw new UploadThingError("Unauthorized")
  }

  return (await response.json()) as {
    role: "admin" | "instructor" | "student"
  }
}

export const uploadRouter: FileRouter = {
  avatarImage: f({
    "image/jpeg": { maxFileCount: 1, maxFileSize: "4MB" },
    "image/png": { maxFileCount: 1, maxFileSize: "4MB" },
    "image/webp": { maxFileCount: 1, maxFileSize: "4MB" },
  })
    .middleware(async ({ req }) => {
      const profile = await getAuthenticatedProfile(req)

      return { role: profile.role }
    })
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
  courseThumbnailImage: f({
    "image/jpeg": { maxFileCount: 1, maxFileSize: "4MB" },
    "image/png": { maxFileCount: 1, maxFileSize: "4MB" },
    "image/webp": { maxFileCount: 1, maxFileSize: "4MB" },
  })
    .middleware(async ({ req }) => {
      const profile = await getAuthenticatedProfile(req)

      if (!["admin", "instructor"].includes(profile.role)) {
        throw new UploadThingError("Access denied.")
      }

      return { role: profile.role }
    })
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
  editorUploader: f({
    blob: { maxFileCount: 1, maxFileSize: "16MB" },
  })
    .middleware(async ({ req }) => {
      const profile = await getAuthenticatedProfile(req)

      if (!["admin", "instructor"].includes(profile.role)) {
        throw new UploadThingError("Access denied.")
      }

      return { role: profile.role }
    })
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
  paymentProofScreenshotImage: f({
    "image/jpeg": { maxFileCount: 1, maxFileSize: "4MB" },
    "image/png": { maxFileCount: 1, maxFileSize: "4MB" },
    "image/webp": { maxFileCount: 1, maxFileSize: "4MB" },
  })
    .middleware(async ({ req }) => {
      const profile = await getAuthenticatedProfile(req)

      if (!["admin", "student"].includes(profile.role)) {
        throw new UploadThingError("Access denied.")
      }

      return { role: profile.role }
    })
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
}

export type UploadRouter = typeof uploadRouter
