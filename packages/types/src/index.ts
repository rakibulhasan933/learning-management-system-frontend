export const userRoles = ["admin", "instructor", "student"] as const
export type UserRole = (typeof userRoles)[number]

export const authProviders = ["password", "google"] as const
export type AuthProvider = (typeof authProviders)[number]

export const courseLevels = [
  "beginner",
  "intermediate",
  "advanced",
  "all_levels",
] as const
export type CourseLevel = (typeof courseLevels)[number]

export const courseStatuses = [
  "draft",
  "pending_review",
  "published",
  "archived",
] as const
export type CourseStatus = (typeof courseStatuses)[number]

export const videoProviders = [
  "r2",
  "bunny",
  "cloudflare_stream",
  "mux",
] as const
export type VideoProvider = (typeof videoProviders)[number]

export const enrollmentStatuses = ["active", "revoked"] as const
export type EnrollmentStatus = (typeof enrollmentStatuses)[number]

export const orderStatuses = [
  "pending_verification",
  "paid",
  "rejected",
  "expired",
  "refunded",
] as const
export type OrderStatus = (typeof orderStatuses)[number]

export const paymentMethods = [
  "bkash",
  "nagad",
  "rocket",
  "bank_transfer",
  "gateway",
] as const
export type PaymentMethod = (typeof paymentMethods)[number]

export interface ApiHealthResponse {
  status: "ok"
}

export interface ApiErrorResponse {
  message: string
}

export interface ProfileDto {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: UserRole
}

export interface AuthSessionDto {
  accessToken: string
  profile: ProfileDto
}

export interface CourseSummaryDto {
  id: string
  title: string
  slug: string
  shortDescription: string | null
  category: string | null
  level: CourseLevel
  price: string
  currency: string
  thumbnailUrl: string | null
  instructorName: string | null
  publishedAt: string | null
}

export interface CourseLectureSummaryDto {
  id: string
  title: string
  position: number
  durationSeconds: number | null
  isPreview: boolean
}

export interface CourseSectionSummaryDto {
  id: string
  title: string
  position: number
  lectures: CourseLectureSummaryDto[]
}

export interface CourseDetailDto extends CourseSummaryDto {
  description: string | null
  sections: CourseSectionSummaryDto[]
}

export interface CourseListResponse {
  courses: CourseSummaryDto[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface InstructorCourseDto {
  id: string
  title: string
  slug: string
  shortDescription: string | null
  description: string | null
  category: string | null
  level: CourseLevel
  price: string
  currency: string
  thumbnailUrl: string | null
  status: CourseStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface InstructorCourseListResponse {
  courses: InstructorCourseDto[]
}

export interface InstructorLectureDto {
  id: string
  sectionId: string
  title: string
  description: string | null
  position: number
  videoProvider: VideoProvider
  videoRef: string | null
  durationSeconds: number | null
  isPreview: boolean
  isPublished: boolean
  availableAt: string | null
  createdAt: string
  updatedAt: string
}

export interface InstructorSectionDto {
  id: string
  courseId: string
  title: string
  description: string | null
  position: number
  dripAfterDays: number
  createdAt: string
  updatedAt: string
  lectures: InstructorLectureDto[]
}

export interface InstructorCourseOutlineResponse {
  sections: InstructorSectionDto[]
}
