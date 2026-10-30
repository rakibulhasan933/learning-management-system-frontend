"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type {
  InstructorCourseDto,
  InstructorCourseListResponse,
  InstructorAssignmentDto,
  InstructorLectureMaterialUploadResponse,
  InstructorLectureDto,
  InstructorQuizDto,
  InstructorSectionDto,
  InstructorVideoUploadUrlResponse,
} from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

function getRequiredString(formData: FormData, key: string) {
  const value = getOptionalString(formData, key)

  if (!value) {
    throw new Error(`${key} is required.`)
  }

  return value
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = getOptionalString(formData, key)

  return value === undefined || value === null ? null : Number(value)
}

function getRequiredNumber(formData: FormData, key: string) {
  return Number(getRequiredString(formData, key))
}

function getCheckboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on"
}

function getCoursePayload(formData: FormData) {
  return {
    category: getOptionalString(formData, "category"),
    currency: getRequiredString(formData, "currency"),
    description: getOptionalString(formData, "description"),
    level: getRequiredString(formData, "level"),
    price: Number(getRequiredString(formData, "price")),
    shortDescription: getOptionalString(formData, "shortDescription"),
    slug: getRequiredString(formData, "slug"),
    status: getRequiredString(formData, "status"),
    thumbnailUrl: getOptionalString(formData, "thumbnailUrl"),
    title: getRequiredString(formData, "title"),
  }
}

function getSectionPayload(formData: FormData) {
  return {
    description: getOptionalString(formData, "description"),
    dripAfterDays: getRequiredNumber(formData, "dripAfterDays"),
    position: getRequiredNumber(formData, "position"),
    title: getRequiredString(formData, "title"),
  }
}

function getSectionCreatePayload(formData: FormData) {
  return {
    description: getOptionalString(formData, "description"),
    dripAfterDays: getRequiredNumber(formData, "dripAfterDays"),
    title: getRequiredString(formData, "title"),
  }
}

function getLecturePayload(formData: FormData) {
  return {
    availableAt: getOptionalString(formData, "availableAt"),
    description: getOptionalString(formData, "description"),
    durationSeconds: getOptionalNumber(formData, "durationSeconds"),
    isPreview: getCheckboxValue(formData, "isPreview"),
    isPublished: getCheckboxValue(formData, "isPublished"),
    position: getRequiredNumber(formData, "position"),
    title: getRequiredString(formData, "title"),
    videoProvider: getRequiredString(formData, "videoProvider"),
    videoRef: getOptionalString(formData, "videoRef"),
  }
}

export async function createInstructorCourseAction(formData: FormData) {
  const slug = getRequiredString(formData, "slug")
  const existing = await authenticatedApiFetch<InstructorCourseListResponse>(
    "/instructor/courses",
    { cache: "no-store" }
  )

  if (
    existing.courses.some(
      (course) => course.slug.toLowerCase() === slug.toLowerCase()
    )
  ) {
    throw new Error(
      `The slug "${slug}" is already in use. Choose a different slug.`
    )
  }

  const course = await authenticatedApiFetch<InstructorCourseDto>(
    "/instructor/courses",
    {
      body: JSON.stringify(getCoursePayload(formData)),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  )

  revalidatePath("/dashboard/instructor/courses")
  redirect(`/dashboard/instructor/courses/${course.id}/edit`)
}

export async function updateInstructorCourseAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")

  await authenticatedApiFetch<InstructorCourseDto>(
    `/instructor/courses/${courseId}`,
    {
      body: JSON.stringify(getCoursePayload(formData)),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    }
  )

  revalidatePath("/dashboard/instructor/courses")
  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}

export async function deleteInstructorCourseAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")

  await authenticatedApiFetch<void>(`/instructor/courses/${courseId}`, {
    method: "DELETE",
  })

  revalidatePath("/dashboard/instructor/courses")
  redirect("/dashboard/instructor/courses")
}

export async function createInstructorSectionAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")

  await authenticatedApiFetch<InstructorSectionDto>(
    `/instructor/courses/${courseId}/sections`,
    {
      body: JSON.stringify(getSectionCreatePayload(formData)),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  )

  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}

export async function updateInstructorSectionAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const sectionId = getRequiredString(formData, "sectionId")

  await authenticatedApiFetch<InstructorSectionDto>(
    `/instructor/courses/${courseId}/sections/${sectionId}`,
    {
      body: JSON.stringify(getSectionPayload(formData)),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    }
  )

  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}

export async function deleteInstructorSectionAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const sectionId = getRequiredString(formData, "sectionId")

  await authenticatedApiFetch<void>(
    `/instructor/courses/${courseId}/sections/${sectionId}`,
    {
      method: "DELETE",
    }
  )

  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}

export async function createInstructorLectureAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const sectionId = getRequiredString(formData, "sectionId")

  await authenticatedApiFetch<InstructorLectureDto>(
    `/instructor/courses/${courseId}/sections/${sectionId}/lectures`,
    {
      body: JSON.stringify(getLecturePayload(formData)),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  )

  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}

export async function createInstructorModuleAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const milestoneId = getRequiredString(formData, "milestoneId")
  const contentTypes = formData
    .getAll("contentTypes")
    .filter((value): value is string => typeof value === "string")
  await authenticatedApiFetch(
    `/instructor/courses/${courseId}/milestones/${milestoneId}/modules`,
    {
      body: JSON.stringify({
        contentTypes,
        description: getOptionalString(formData, "description"),
        title: getRequiredString(formData, "title"),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}

export async function addInstructorModuleContentAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const moduleId = getRequiredString(formData, "moduleId")
  const contentTypes = formData
    .getAll("contentTypes")
    .filter(
      (value): value is "video" | "pdf" | "quiz" | "assignment" =>
        value === "video" ||
        value === "pdf" ||
        value === "quiz" ||
        value === "assignment"
    )
  const contentType = getRequiredString(formData, "contentType")
  if (
    contentType === "video" ||
    contentType === "pdf" ||
    contentType === "quiz" ||
    contentType === "assignment"
  ) {
    if (contentType === "video" || !contentTypes.includes(contentType))
      contentTypes.push(contentType)
  }
  await authenticatedApiFetch(
    `/instructor/courses/${courseId}/modules/${moduleId}`,
    {
      body: JSON.stringify({ contentTypes }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    }
  )
  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}

export async function createInstructorVideoAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const moduleId = getRequiredString(formData, "moduleId")
  await authenticatedApiFetch(
    `/instructor/courses/${courseId}/modules/${moduleId}/videos`,
    {
      body: JSON.stringify({
        description: getOptionalString(formData, "description"),
        durationSeconds: getOptionalNumber(formData, "durationSeconds"),
        isPreview: getCheckboxValue(formData, "isPreview"),
        isPublished: getCheckboxValue(formData, "isPublished"),
        position: getRequiredNumber(formData, "position"),
        title: getRequiredString(formData, "title"),
        videoProvider: getOptionalString(formData, "videoProvider") ?? "r2",
        videoRef: getOptionalString(formData, "videoRef"),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}

export async function updateInstructorModuleAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const moduleId = getRequiredString(formData, "moduleId")
  await authenticatedApiFetch(
    `/instructor/courses/${courseId}/modules/${moduleId}`,
    {
      body: JSON.stringify({
        description: getOptionalString(formData, "description") ?? null,
        title: getRequiredString(formData, "title"),
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    }
  )
  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}

export async function deleteInstructorModuleAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const moduleId = getRequiredString(formData, "moduleId")
  await authenticatedApiFetch(
    `/instructor/courses/${courseId}/modules/${moduleId}`,
    { method: "DELETE" }
  )
  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}

export async function deleteInstructorVideoAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const videoId = getRequiredString(formData, "videoId")
  await authenticatedApiFetch(
    `/instructor/courses/${courseId}/videos/${videoId}`,
    { method: "DELETE" }
  )
  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}

export async function publishInstructorVideoAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const videoId = getRequiredString(formData, "videoId")
  await authenticatedApiFetch(
    `/instructor/courses/${courseId}/videos/${videoId}`,
    {
      body: JSON.stringify({ isPublished: true }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    }
  )
  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}

export async function updateInstructorLectureAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const lectureId = getRequiredString(formData, "lectureId")

  await authenticatedApiFetch<InstructorLectureDto>(
    `/instructor/courses/${courseId}/lectures/${lectureId}`,
    {
      body: JSON.stringify(getLecturePayload(formData)),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    }
  )

  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}

export async function requestLectureVideoUploadAction(input: {
  contentType: string
  courseId: string
  fileName: string
  lectureId: string
}) {
  return authenticatedApiFetch<InstructorVideoUploadUrlResponse>(
    `/instructor/courses/${input.courseId}/lectures/${input.lectureId}/video-upload-url`,
    {
      body: JSON.stringify({
        contentType: input.contentType,
        fileName: input.fileName,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  )
}

export async function requestModuleVideoUploadAction(input: {
  contentType: string
  courseId: string
  fileName: string
  videoId: string
}) {
  return authenticatedApiFetch<InstructorVideoUploadUrlResponse>(
    `/instructor/courses/${input.courseId}/videos/${input.videoId}/video-upload-url`,
    {
      body: JSON.stringify({
        contentType: input.contentType,
        fileName: input.fileName,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
}

export async function updateInstructorVideoAfterUploadAction(input: {
  courseId: string
  durationSeconds: number | null
  title: string
  videoId: string
  videoRef: string
}) {
  await authenticatedApiFetch(
    `/instructor/courses/${input.courseId}/videos/${input.videoId}`,
    {
      body: JSON.stringify({
        durationSeconds: input.durationSeconds,
        title: input.title,
        videoRef: input.videoRef,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    }
  )
}

export async function requestModuleMaterialUploadAction(input: {
  contentType: string
  courseId: string
  fileName: string
  kind: "pdf" | "slides"
  moduleId: string
}) {
  return authenticatedApiFetch<{
    headers: Record<string, string>
    publicUrl: string
    uploadUrl: string
  }>(
    `/instructor/courses/${input.courseId}/modules/${input.moduleId}/material-upload-url`,
    {
      body: JSON.stringify({
        contentType: input.contentType,
        fileName: input.fileName,
        kind: input.kind,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
}

export async function completeModuleMaterialUploadAction(input: {
  courseId: string
  kind: "pdf" | "slides"
  moduleId: string
  url: string
}) {
  await authenticatedApiFetch(
    `/instructor/courses/${input.courseId}/modules/${input.moduleId}/material-complete`,
    {
      body: JSON.stringify({ kind: input.kind, url: input.url }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
}

export async function saveLectureVideoRefAction(input: {
  courseId: string
  lectureId: string
  videoRef: string
}) {
  await authenticatedApiFetch<InstructorLectureDto>(
    `/instructor/courses/${input.courseId}/lectures/${input.lectureId}`,
    {
      body: JSON.stringify({
        videoProvider: "r2",
        videoRef: input.videoRef,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    }
  )

  revalidatePath(`/dashboard/instructor/courses/${input.courseId}/edit`)
}

export interface LectureVideoUploadState {
  message: string | null
}

export async function uploadLectureVideoAction(
  _previousState: LectureVideoUploadState,
  formData: FormData
): Promise<LectureVideoUploadState> {
  const courseId = getRequiredString(formData, "courseId")
  const lectureId = getRequiredString(formData, "lectureId")
  const file = formData.get("videoFile")

  if (!(file instanceof File) || file.size === 0) {
    return { message: "Choose an MP4 file first." }
  }

  if (file.type !== "video/mp4") {
    return { message: "Only MP4 videos are supported." }
  }

  try {
    const presign = await requestLectureVideoUploadAction({
      contentType: file.type,
      courseId,
      fileName: file.name,
      lectureId,
    })

    const uploadResponse = await fetch(presign.uploadUrl, {
      body: Buffer.from(await file.arrayBuffer()),
      headers: presign.headers,
      method: "PUT",
    })

    if (!uploadResponse.ok) {
      throw new Error("R2 upload failed.")
    }

    await saveLectureVideoRefAction({
      courseId,
      lectureId,
      videoRef: presign.videoRef,
    })

    return { message: "Video uploaded and saved." }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Video upload failed.",
    }
  }
}

export async function uploadLectureMaterialAction(input: {
  base64: string
  contentType: string
  courseId: string
  fileName: string
  kind: "pdf" | "slides"
  lectureId: string
}) {
  const response =
    await authenticatedApiFetch<InstructorLectureMaterialUploadResponse>(
      `/instructor/courses/${input.courseId}/lectures/${input.lectureId}/material`,
      {
        body: JSON.stringify({
          base64: input.base64,
          contentType: input.contentType,
          fileName: input.fileName,
          kind: input.kind,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    )

  revalidatePath(`/dashboard/instructor/courses/${input.courseId}/edit`)

  return response
}

export async function uploadVideoMaterialAction(input: {
  base64: string
  contentType: string
  courseId: string
  fileName: string
  kind: "pdf" | "slides"
  videoId: string
}) {
  return authenticatedApiFetch<{ url: string }>(
    `/instructor/courses/${input.courseId}/videos/${input.videoId}/material`,
    {
      body: JSON.stringify(input),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
}

export async function uploadModuleMaterialAction(input: {
  base64: string
  contentType: string
  courseId: string
  fileName: string
  kind: "pdf" | "slides"
  moduleId: string
}) {
  return authenticatedApiFetch<{ url: string }>(
    `/instructor/courses/${input.courseId}/modules/${input.moduleId}/material`,
    {
      body: JSON.stringify(input),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
}

export async function saveInstructorQuizAction(input: {
  courseId: string
  isPublished: boolean
  questions: Array<{
    options: Array<{
      isCorrect: boolean
      optionText: string
      position: number
    }>
    position: number
    questionText: string
  }>
  targetId: string
  targetType: "lecture" | "section" | "module"
  title: string
}) {
  const path =
    input.targetType === "lecture"
      ? `/instructor/courses/${input.courseId}/lectures/${input.targetId}/quiz`
      : input.targetType === "module"
        ? `/instructor/courses/${input.courseId}/modules/${input.targetId}/quiz`
        : `/instructor/courses/${input.courseId}/sections/${input.targetId}/quiz`

  await authenticatedApiFetch<InstructorQuizDto>(path, {
    body: JSON.stringify({
      isPublished: input.isPublished,
      questions: input.questions,
      title: input.title,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
  })

  revalidatePath(`/dashboard/instructor/courses/${input.courseId}/edit`)
}

export async function deleteInstructorQuizAction(input: {
  courseId: string
  quizId: string
}) {
  await authenticatedApiFetch<void>(
    `/instructor/courses/${input.courseId}/quizzes/${input.quizId}`,
    {
      method: "DELETE",
    }
  )

  revalidatePath(`/dashboard/instructor/courses/${input.courseId}/edit`)
}

export async function saveInstructorAssignmentAction(input: {
  courseId: string
  dueAt: string | null
  instructions: string
  isPublished: boolean
  maxScore: number
  targetId: string
  targetType: "lecture" | "section" | "module"
  title: string
}) {
  const path =
    input.targetType === "section"
      ? `/instructor/courses/${input.courseId}/sections/${input.targetId}/assignment`
      : input.targetType === "module"
        ? `/instructor/courses/${input.courseId}/modules/${input.targetId}/assignment`
        : `/instructor/courses/${input.courseId}/lectures/${input.targetId}/assignment`

  await authenticatedApiFetch<InstructorAssignmentDto>(path, {
    body: JSON.stringify({
      dueAt: input.dueAt,
      instructions: input.instructions,
      isPublished: input.isPublished,
      maxScore: input.maxScore,
      title: input.title,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
  })

  revalidatePath(`/dashboard/instructor/courses/${input.courseId}/edit`)
}

export async function deleteInstructorAssignmentAction(input: {
  assignmentId: string
  courseId: string
}) {
  await authenticatedApiFetch<void>(
    `/instructor/courses/${input.courseId}/assignments/${input.assignmentId}`,
    {
      method: "DELETE",
    }
  )

  revalidatePath(`/dashboard/instructor/courses/${input.courseId}/edit`)
}

export async function gradeAssignmentSubmissionAction(input: {
  courseId: string
  gradeFeedback: string | null
  gradeScore: number
  submissionId: string
}) {
  await authenticatedApiFetch<void>(
    `/instructor/courses/${input.courseId}/assignment-submissions/${input.submissionId}/grade`,
    {
      body: JSON.stringify({
        gradeFeedback: input.gradeFeedback,
        gradeScore: input.gradeScore,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    }
  )

  revalidatePath(`/dashboard/instructor/courses/${input.courseId}/edit`)
}

export async function deleteInstructorLectureAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const lectureId = getRequiredString(formData, "lectureId")

  await authenticatedApiFetch<void>(
    `/instructor/courses/${courseId}/lectures/${lectureId}`,
    {
      method: "DELETE",
    }
  )

  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}
