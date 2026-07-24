import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type { ImageUploadResponse } from "@workspace/types"

import { asyncHandler, HttpError } from "../http/errors.js"
import {
  uploadCourseThumbnailImage,
  uploadProfileAvatarImage,
} from "../lib/supabase-storage.js"
import { requireAuth } from "../middleware/auth.js"

export const uploadsRouter: ExpressRouter = Router()

const imageUploadSchema = z.object({
  base64: z.string().min(1),
  contentType: z.enum([
    "image/avif",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]),
  fileName: z.string().trim().min(1).max(255),
  purpose: z.enum(["course_thumbnail", "avatar"]),
})

uploadsRouter.post(
  "/image",
  requireAuth,
  asyncHandler(async (request, response) => {
    const input = imageUploadSchema.parse(request.body)

    if (input.purpose === "course_thumbnail") {
      if (!["admin", "instructor"].includes(request.auth!.profile.role)) {
        throw new HttpError(403, "Access denied.")
      }

      const url = await uploadCourseThumbnailImage({
        base64: input.base64,
        contentType: input.contentType,
        fileName: input.fileName,
      })

      const payload: ImageUploadResponse = { url }
      response.status(201).json(payload)
      return
    }

    const url = await uploadProfileAvatarImage({
      base64: input.base64,
      contentType: input.contentType,
      fileName: input.fileName,
    })

    const payload: ImageUploadResponse = { url }
    response.status(201).json(payload)
  }),
)
