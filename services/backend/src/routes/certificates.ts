import { randomBytes, randomUUID } from "node:crypto"
import {
  and,
  certificates,
  courses,
  enrollments,
  eq,
  lectures,
  profiles,
  progress,
  sections,
  sql,
  users,
} from "@workspace/db"
import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type {
  CertificateDownloadResponse,
  CertificateDto,
  CertificateListResponse,
} from "@workspace/types"

import { asyncHandler, HttpError } from "../http/errors.js"
import { db } from "../lib/database.js"
import { generateCertificatePdf } from "../lib/certificate-pdf.js"
import { uploadCertificatePdf } from "../lib/supabase-storage.js"
import { requireAuth, requireRole } from "../middleware/auth.js"

export const certificatesRouter: ExpressRouter = Router()

const certificateParamsSchema = z.object({
  certificateId: z.string().uuid(),
})

type CertificateRow = {
  certificateUrl: string
  courseId: string
  courseTitle: string
  id: string
  issuedAt: Date
  studentEmail: string
  studentName: string | null
  verificationCode: string
}

function createVerificationCode() {
  return `CERT-${randomBytes(6).toString("hex").toUpperCase()}`
}

function toCertificateDto(row: CertificateRow): CertificateDto {
  return {
    certificateUrl: row.certificateUrl,
    courseId: row.courseId,
    courseTitle: row.courseTitle,
    id: row.id,
    issuedAt: row.issuedAt.toISOString(),
    studentName: row.studentName ?? row.studentEmail,
    verificationCode: row.verificationCode,
  }
}

async function getCompletedCourseIds(profileId: string) {
  const rows = await db
    .select({
      completedLectures: sql<number>`count(${progress.id}) filter (where ${progress.isCompleted} = true)`,
      courseId: courses.id,
      totalLectures: sql<number>`count(${lectures.id})`,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(sections, eq(sections.courseId, courses.id))
    .innerJoin(lectures, eq(lectures.sectionId, sections.id))
    .leftJoin(
      progress,
      and(
        eq(progress.lectureId, lectures.id),
        eq(progress.userId, enrollments.userId),
      ),
    )
    .where(
      and(
        eq(enrollments.userId, profileId),
        eq(enrollments.status, "active"),
        eq(lectures.isPublished, true),
      ),
    )
    .groupBy(courses.id)

  return rows
    .filter(
      (row) =>
        Number(row.totalLectures) > 0 &&
        Number(row.completedLectures) === Number(row.totalLectures),
    )
    .map((row) => row.courseId)
}

async function getCertificateRows(profileId: string) {
  const rows = await db
    .select({
      certificateUrl: certificates.certificateUrl,
      courseId: certificates.courseId,
      courseTitle: courses.title,
      id: certificates.id,
      issuedAt: certificates.issuedAt,
      studentEmail: users.email,
      studentName: profiles.fullName,
      verificationCode: certificates.verificationCode,
    })
    .from(certificates)
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .innerJoin(profiles, eq(certificates.userId, profiles.id))
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(certificates.userId, profileId))
    .orderBy(sql`${certificates.issuedAt} desc`)

  return rows as CertificateRow[]
}

async function issueCertificate(profileId: string, courseId: string) {
  const [existing] = await db
    .select({ id: certificates.id })
    .from(certificates)
    .where(
      and(
        eq(certificates.userId, profileId),
        eq(certificates.courseId, courseId),
      ),
    )
    .limit(1)

  if (existing) {
    return
  }

  const [details] = await db
    .select({
      courseTitle: courses.title,
      studentEmail: users.email,
      studentName: profiles.fullName,
    })
    .from(courses)
    .innerJoin(profiles, eq(profiles.id, profileId))
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(courses.id, courseId))
    .limit(1)

  if (!details) {
    return
  }

  const certificateId = randomUUID()
  const issuedAt = new Date()
  const verificationCode = createVerificationCode()
  const pdf = generateCertificatePdf({
    completionDate: issuedAt,
    courseTitle: details.courseTitle,
    studentName: details.studentName ?? details.studentEmail,
    verificationCode,
  })
  const certificateUrl = await uploadCertificatePdf({ certificateId, pdf })

  await db
    .insert(certificates)
    .values({
      certificateUrl,
      courseId,
      id: certificateId,
      issuedAt,
      userId: profileId,
      verificationCode,
    })
    .onConflictDoNothing()
}

async function issueMissingCertificates(profileId: string) {
  const completedCourseIds = await getCompletedCourseIds(profileId)

  for (const courseId of completedCourseIds) {
    await issueCertificate(profileId, courseId)
  }
}

certificatesRouter.get(
  "/",
  requireAuth,
  requireRole(["admin", "student"]),
  asyncHandler(async (request, response) => {
    await issueMissingCertificates(request.auth!.profile.id)

    response.status(200).json({
      certificates: (await getCertificateRows(request.auth!.profile.id)).map(
        toCertificateDto,
      ),
    } satisfies CertificateListResponse)
  }),
)

certificatesRouter.get(
  "/:certificateId/download-url",
  requireAuth,
  requireRole(["admin", "student"]),
  asyncHandler(async (request, response) => {
    const { certificateId } = certificateParamsSchema.parse(request.params)
    const [certificate] = await db
      .select({
        certificateUrl: certificates.certificateUrl,
        userId: certificates.userId,
      })
      .from(certificates)
      .where(eq(certificates.id, certificateId))
      .limit(1)

    if (!certificate) {
      throw new HttpError(404, "Certificate not found.")
    }

    if (certificate.userId !== request.auth!.profile.id) {
      throw new HttpError(403, "Access denied.")
    }

    response.status(200).json({
      downloadUrl: certificate.certificateUrl,
    } satisfies CertificateDownloadResponse)
  }),
)

certificatesRouter.get(
  "/:certificateId/download",
  requireAuth,
  requireRole(["admin", "student"]),
  asyncHandler(async (request, response) => {
    const { certificateId } = certificateParamsSchema.parse(request.params)
    const [certificate] = await db
      .select({
        certificateUrl: certificates.certificateUrl,
        userId: certificates.userId,
      })
      .from(certificates)
      .where(eq(certificates.id, certificateId))
      .limit(1)

    if (!certificate) {
      throw new HttpError(404, "Certificate not found.")
    }

    if (certificate.userId !== request.auth!.profile.id) {
      throw new HttpError(403, "Access denied.")
    }

    response.redirect(certificate.certificateUrl)
  }),
)
