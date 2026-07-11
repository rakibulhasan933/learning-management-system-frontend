"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type {
  InstructorCourseDto,
  InstructorLectureDto,
  InstructorSectionDto,
} from "@workspace/types"

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
  const course = await authenticatedApiFetch<InstructorCourseDto>(
    "/instructor/courses",
    {
      body: JSON.stringify(getCoursePayload(formData)),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
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
    },
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
      body: JSON.stringify(getSectionPayload(formData)),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
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
    },
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
    },
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
    },
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
    },
  )

  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}

export async function deleteInstructorLectureAction(formData: FormData) {
  const courseId = getRequiredString(formData, "courseId")
  const lectureId = getRequiredString(formData, "lectureId")

  await authenticatedApiFetch<void>(
    `/instructor/courses/${courseId}/lectures/${lectureId}`,
    {
      method: "DELETE",
    },
  )

  revalidatePath(`/dashboard/instructor/courses/${courseId}/edit`)
}
