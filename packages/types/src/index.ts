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
  quiz: InstructorQuizDto | null
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
  quiz: InstructorQuizDto | null
}

export interface InstructorCourseOutlineResponse {
  sections: InstructorSectionDto[]
}

export interface InstructorQuizOptionDto {
  id: string
  optionText: string
  position: number
  isCorrect: boolean
}

export interface InstructorQuizQuestionDto {
  id: string
  questionText: string
  position: number
  options: InstructorQuizOptionDto[]
}

export interface InstructorQuizDto {
  id: string
  courseId: string
  sectionId: string | null
  lectureId: string | null
  title: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
  questions: InstructorQuizQuestionDto[]
}

export interface StudentQuizOptionDto {
  id: string
  optionText: string
  position: number
}

export interface StudentQuizQuestionDto {
  id: string
  questionText: string
  position: number
  allowMultiple: boolean
  options: StudentQuizOptionDto[]
}

export interface StudentQuizAttemptDto {
  id: string
  quizId: string
  score: number
  totalQuestions: number
  percentage: number
  completedAt: string
}

export interface StudentQuizDto {
  id: string
  courseId: string
  sectionId: string | null
  lectureId: string | null
  title: string
  questions: StudentQuizQuestionDto[]
  latestAttempt: StudentQuizAttemptDto | null
}

export interface QuizSubmissionResultDto extends StudentQuizAttemptDto {
  correctQuestionIds: string[]
}

export interface InstructorVideoUploadUrlResponse {
  expiresInSeconds: number
  headers: Record<string, string>
  uploadUrl: string
  videoProvider: "r2"
  videoRef: string
}

export interface LectureVideoUrlResponse {
  expiresInSeconds: number
  provider: VideoProvider
  url: string
}

export interface LearningLectureDto {
  id: string
  sectionId: string
  title: string
  position: number
  durationSeconds: number | null
  isPreview: boolean
  availableAt: string | null
  quiz: StudentQuizDto | null
}

export interface LearningSectionDto {
  id: string
  title: string
  position: number
  lectures: LearningLectureDto[]
  quiz: StudentQuizDto | null
}

export interface LearningCourseResponse {
  course: {
    id: string
    title: string
    slug: string
  }
  learner: {
    email: string
  }
  sections: LearningSectionDto[]
}

export interface ManualPaymentInstructionsDto {
  bkashNumber: string | null
  nagadNumber: string | null
  rocketNumber: string | null
  bankDetails: string | null
}

export interface PaymentOrderDto {
  id: string
  courseId: string
  courseSlug: string
  courseTitle: string
  studentEmail: string
  studentName: string | null
  amount: string
  originalAmount: string
  discountAmount: string
  currency: string
  couponCode: string | null
  referenceCode: string
  status: OrderStatus
  paymentMethod: PaymentMethod | null
  transactionId: string | null
  senderNumber: string | null
  proofScreenshotUrl: string | null
  reviewedByEmail: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}

export interface PaymentInstructionsResponse {
  instructions: ManualPaymentInstructionsDto
  order: PaymentOrderDto
}

export interface StudentOrderListResponse {
  orders: PaymentOrderDto[]
}

export interface AdminPendingPaymentsResponse {
  orders: PaymentOrderDto[]
}

export interface CertificateDto {
  id: string
  courseId: string
  courseTitle: string
  studentName: string
  certificateUrl: string
  issuedAt: string
  verificationCode: string
}

export interface CertificateListResponse {
  certificates: CertificateDto[]
}

export interface CertificateDownloadResponse {
  downloadUrl: string
}
