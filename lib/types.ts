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

export const payoutStatuses = [
  "pending",
  "approved",
  "rejected",
  "paid",
] as const
export type PayoutStatus = (typeof payoutStatuses)[number]

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
  /** Present only for non-browser clients that store it in secure OS storage. */
  refreshToken?: string
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
  enrollmentEnabled: boolean
  enrollmentEndsAt: string | null
  /** Public rating summary, present on the course detail payload. */
  averageRating?: number | null
  reviewCount?: number
}

export interface CourseLectureSummaryDto {
  id: string
  title: string
  position: number
  durationSeconds: number | null
  isPreview: boolean
}

export interface CourseModuleSummaryDto {
  id: string
  title: string
  position: number
  contentTypes: Array<"video" | "pdf" | "quiz" | "assignment">
  videoCount: number
  durationSeconds: number
}

export interface CourseSectionSummaryDto {
  id: string
  title: string
  position: number
  lectures: CourseLectureSummaryDto[]
  modules: CourseModuleSummaryDto[]
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

export interface CourseEnrollmentOrderSummaryDto {
  id: string
  status: OrderStatus
  rejectionReason: string | null
}

export interface CourseEnrollmentStatusResponse {
  courseId: string
  isAuthenticated: boolean
  isEnrolled: boolean
  enrollmentStatus: EnrollmentStatus | null
  /**
   * Most relevant open order for the viewer, used to show "payment under
   * review" / "resubmit payment proof" when there is no active enrollment yet.
   */
  latestOrder: CourseEnrollmentOrderSummaryDto | null
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
  pdfUrl: string | null
  slidesUrl: string | null
  durationSeconds: number | null
  isPreview: boolean
  isPublished: boolean
  availableAt: string | null
  createdAt: string
  updatedAt: string
  quiz: InstructorQuizDto | null
  assignment: InstructorAssignmentDto | null
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
  assignment: InstructorAssignmentDto | null
}

export interface InstructorCourseOutlineResponse {
  sections: InstructorSectionDto[]
}

export interface InstructorVideoDto {
  id: string
  moduleId: string
  title: string
  description: string | null
  position: number
  videoProvider: VideoProvider
  videoRef: string | null
  pdfUrl: string | null
  slidesUrl: string | null
  durationSeconds: number | null
  isPreview: boolean
  isPublished: boolean
  availableAt: string | null
  createdAt: string
  updatedAt: string
}

export interface InstructorModuleDto {
  id: string
  milestoneId: string
  contentTypes: Array<"video" | "pdf" | "quiz" | "assignment">
  title: string
  description: string | null
  pdfUrl: string | null
  slidesUrl: string | null
  position: number
  videos: InstructorVideoDto[]
  quiz: InstructorQuizDto | null
  assignment: InstructorAssignmentDto | null
}

export interface InstructorMilestoneDto {
  id: string
  courseId: string
  title: string
  description: string | null
  position: number
  dripAfterDays: number
  modules: InstructorModuleDto[]
}

export interface InstructorCourseStructureResponse {
  milestones: InstructorMilestoneDto[]
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
  moduleId: string | null
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
  moduleId: string | null
  title: string
  questions: StudentQuizQuestionDto[]
  latestAttempt: StudentQuizAttemptDto | null
  review: StudentQuizReviewDto | null
}

export interface StudentQuizReviewDto {
  answers: Record<string, string[]>
  correctOptionIds: Record<string, string[]>
  correctQuestionIds: string[]
}

export interface QuizSubmissionResultDto extends StudentQuizAttemptDto {
  correctOptionIds: Record<string, string[]>
  correctQuestionIds: string[]
  review: {
    answers: Record<string, string[]>
    correctOptionIds: Record<string, string[]>
  }
}

export interface InstructorAssignmentSubmissionDto {
  id: string
  assignmentId: string
  studentId: string
  studentEmail: string
  studentName: string | null
  submissionText: string
  submittedAt: string
  gradeScore: number | null
  gradeFeedback: string | null
  gradedByEmail: string | null
  gradedAt: string | null
  updatedAt: string
}

export interface InstructorAssignmentDto {
  id: string
  courseId: string
  sectionId: string | null
  lectureId: string | null
  moduleId: string | null
  title: string
  instructions: string
  maxScore: number
  isPublished: boolean
  dueAt: string | null
  createdAt: string
  updatedAt: string
  submissions: InstructorAssignmentSubmissionDto[]
}

export interface StudentAssignmentSubmissionDto {
  id: string
  assignmentId: string
  submissionText: string
  submittedAt: string
  gradeScore: number | null
  gradeFeedback: string | null
  gradedAt: string | null
  updatedAt: string
}

export interface StudentAssignmentDto {
  id: string
  courseId: string
  sectionId: string | null
  lectureId: string | null
  moduleId: string | null
  title: string
  instructions: string
  maxScore: number
  dueAt: string | null
  submission: StudentAssignmentSubmissionDto | null
}

export interface InstructorVideoUploadUrlResponse {
  expiresInSeconds: number
  headers: Record<string, string>
  uploadUrl: string
  videoProvider: "r2"
  videoRef: string
}

export interface InstructorLectureMaterialUploadResponse {
  lecture: InstructorLectureDto
  url: string
}

export interface ImageUploadResponse {
  url: string
}

export interface LectureVideoUrlResponse {
  expiresInSeconds: number
  provider: VideoProvider
  url: string
}

export interface LectureProgressDto {
  completedAt: string | null
  id: string
  isCompleted: boolean
  lastWatchedAt: string
  lectureId: string
  positionSeconds: number
  updatedAt: string
}

export interface LectureProgressMutationResponse {
  progress: LectureProgressDto
}

export interface LearningLectureDto {
  id: string
  sectionId: string
  moduleId: string
  moduleTitle: string
  modulePdfUrl: string | null
  moduleSlidesUrl: string | null
  title: string
  description: string | null
  position: number
  durationSeconds: number | null
  isPreview: boolean
  availableAt: string | null
  pdfUrl: string | null
  slidesUrl: string | null
  quiz: StudentQuizDto | null
  assignment: StudentAssignmentDto | null
  progress: LectureProgressDto | null
}

export interface LearningModuleDto {
  id: string
  title: string
  position: number
  contentTypes: Array<"video" | "pdf" | "quiz" | "assignment">
  pdfUrl: string | null
  slidesUrl: string | null
  videos: LearningLectureDto[]
  quiz: StudentQuizDto | null
  assignment: StudentAssignmentDto | null
}

export interface LearningSectionDto {
  id: string
  title: string
  position: number
  lectures: LearningLectureDto[]
  modules: LearningModuleDto[]
  quiz: StudentQuizDto | null
  assignment: StudentAssignmentDto | null
}

export interface LearningCourseResponse {
  course: {
    completedLectureCount: number
    completionPercentage: number
    id: string
    title: string
    slug: string
    totalLectureCount: number
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
  thumbnailUrl: string | null
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

export interface StudentAnalyticsCourseDto {
  courseId: string
  courseTitle: string
  totalLectures: number
  completedLectures: number
  completionPercentage: number
  lastActivityAt: string | null
}

export interface StudentWeeklyActivityDto {
  date: string
  label: string
  minutes: number
  lecturesCompleted: number
}

export interface StudentQuizPerformanceDto {
  quizTitle: string
  percentage: number
  score: number
  totalQuestions: number
}

export interface StudentAnalyticsResponse {
  activeCourses: number
  totalLectures: number
  completedLectures: number
  completionPercentage: number
  watchTimeSeconds: number
  quizAttempts: number
  quizAveragePercentage: number
  assignmentsSubmitted: number
  assignmentsPending: number
  assignmentsGraded: number
  assignmentAveragePercentage: number
  learningStreakDays: number
  lastActivityAt: string | null
  weeklyActivity: StudentWeeklyActivityDto[]
  quizPerformance: StudentQuizPerformanceDto[]
  courses: StudentAnalyticsCourseDto[]
}

export interface CertificateDownloadResponse {
  downloadUrl: string
}

export interface AdminUserDto {
  id: string
  profileId: string
  email: string
  fullName: string | null
  role: UserRole
  authProvider: AuthProvider
  emailVerifiedAt: string | null
  suspendedAt: string | null
  createdAt: string
}

export interface AdminUserListResponse {
  users: AdminUserDto[]
}

export interface AdminCreateInstructorRequest {
  email: string
  fullName: string | null
  password: string
}

export interface AdminCreateInstructorResponse {
  user: AdminUserDto
}

export interface AdminCourseReviewDto {
  category: string | null
  id: string
  title: string
  slug: string
  instructorEmail: string
  instructorName: string | null
  price: string
  currency: string
  status: CourseStatus
  submittedAt: string
  updatedAt: string
  enrollmentEnabled: boolean
  enrollmentEndsAt: string | null
}

export interface AdminCourseApprovalQueueResponse {
  courses: AdminCourseReviewDto[]
}

export interface AdminRevenuePointDto {
  label: string
  revenue: number
  orders: number
}

export interface AdminRevenueOverviewResponse {
  totals: {
    paidRevenue: number
    paidOrders: number
    pendingRevenue: number
    pendingOrders: number
    activeEnrollments: number
    publishedCourses: number
    pendingCourses: number
    activeUsers: number
    suspendedUsers: number
  }
  byMonth: AdminRevenuePointDto[]
  byMethod: AdminRevenuePointDto[]
}

export interface AdminCategoryDto {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminCategoryListResponse {
  categories: AdminCategoryDto[]
}

export interface AdminSiteSettingsResponse {
  settings: Record<string, string>
}

export interface AdminCouponUsageStudentDto {
  courseId: string
  courseTitle: string
  createdAt: string
  discountAmount: string
  email: string
  fullName: string | null
  orderId: string
  status: string
}

export interface AdminCouponUsageDto {
  active: boolean
  code: string
  claims: number
  expiresAt: string | null
  limit: number | null
  totalDiscount: string
  students: AdminCouponUsageStudentDto[]
}

export interface AdminCouponUsageResponse {
  coupons: AdminCouponUsageDto[]
}

export interface AdminAuditLogDto {
  id: string
  actorEmail: string | null
  action: string
  entityType: string
  entityId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface AdminAuditLogListResponse {
  logs: AdminAuditLogDto[]
}

export type RefundStatus = "requested" | "approved" | "rejected" | "processed"

export interface AdminRefundDto {
  id: string
  orderId: string
  studentEmail: string
  courseTitle: string
  amount: string
  currency: string
  reason: string
  status: RefundStatus
  reviewedByEmail: string | null
  reviewedAt: string | null
  processedAt: string | null
  createdAt: string
}

export interface AdminRefundListResponse {
  refunds: AdminRefundDto[]
}

export interface AdminEnrollmentDto {
  id: string
  studentEmail: string
  studentName: string | null
  courseId: string
  courseTitle: string
  orderId: string | null
  status: EnrollmentStatus
  enrolledAt: string
  revokedAt: string | null
}

export interface AdminEnrollmentListResponse {
  enrollments: AdminEnrollmentDto[]
}

export interface InstructorCourseAnalyticsDto {
  id: string
  title: string
  slug: string
  status: CourseStatus
  currency: string
  price: string
  enrollmentCount: number
  activeEnrollmentCount: number
  completedEnrollmentCount: number
  completionRate: number
  revenue: number
  totalLectureCount: number
}

export interface InstructorAnalyticsOverviewResponse {
  totals: {
    activeEnrollmentCount: number
    completedEnrollmentCount: number
    courseCount: number
    completionRate: number
    availablePayoutBalance: number
    pendingPayoutRequestCount: number
    reservedPayoutAmount: number
    revenue: number
  }
  courses: InstructorCourseAnalyticsDto[]
}

export interface InstructorCourseStudentDto {
  enrollmentId: string
  userId: string
  email: string
  fullName: string | null
  enrollmentStatus: "active" | "revoked"
  enrolledAt: string
  revokedAt: string | null
  totalLectureCount: number
  completedLectureCount: number
  completionRate: number
  isCompleted: boolean
  lastWatchedAt: string | null
  completedAt: string | null
}

export interface InstructorCourseStudentsResponse {
  course: {
    id: string
    slug: string
    title: string
  }
  metrics: {
    activeEnrollmentCount: number
    completedEnrollmentCount: number
    completionRate: number
    enrollmentCount: number
    revenue: number
    totalLectureCount: number
  }
  students: InstructorCourseStudentDto[]
}

export interface PayoutRequestDto {
  id: string
  instructorId: string
  instructorEmail: string
  instructorName: string | null
  amount: string
  currency: string
  referenceCode: string
  status: PayoutStatus
  note: string | null
  reviewedByEmail: string | null
  reviewedAt: string | null
  paidAt: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}

export interface InstructorPayoutListResponse {
  payouts: PayoutRequestDto[]
  availableBalance: number
  reservedAmount: number
  totalRevenue: number
}

export interface AdminPayoutListResponse {
  payouts: PayoutRequestDto[]
}

export interface DiscussionPostDto {
  id: string
  courseId: string
  lectureId: string | null
  parentId: string | null
  body: string
  authorId: string
  authorName: string | null
  authorRole: UserRole
  createdAt: string
}

export interface DiscussionListResponse {
  posts: DiscussionPostDto[]
}

export interface NotificationDto {
  id: string
  type: string
  title: string
  body: string
  href: string | null
  readAt: string | null
  createdAt: string
}

export interface NotificationListResponse {
  notifications: NotificationDto[]
  unreadCount: number
}

export interface QuizResultDto {
  attemptId: string
  quizId: string
  quizTitle: string
  courseId: string
  courseTitle: string
  studentId: string
  studentName: string | null
  studentEmail: string
  score: number
  totalQuestions: number
  percentage: number
  completedAt: string
}

export interface InstructorQuizResultsResponse {
  results: QuizResultDto[]
}

export interface AnnouncementDto {
  id: string
  courseId: string
  courseTitle: string
  title: string
  body: string
  createdAt: string
}

export interface AnnouncementListResponse {
  announcements: AnnouncementDto[]
}

/* ---- Features 2-5: bundles / subscriptions / instalments / seller dashboard / question bank / model tests ---- */

export interface BundleDto {
  id: string
  title: string
  courseIds: string[]
  price: string
  originalPrice: string | null
  currency: string
  durationDays: number | null
  instructorId: string
  isPublished: boolean
  description: string | null
}

export interface BundleListResponse {
  bundles: BundleDto[]
}

export interface BundleOrderResponse {
  bundleId: string
  courseIds: string[]
  order: {
    id: string
    amount: string
    currency: string
    referenceCode?: string
    status: string
  }
  payVia: string
}

export interface SubscriptionResponse {
  order: { id: string; amount: string; currency: string; status: string }
  payVia: string
  subscription: {
    id: string
    months: number
    status: string
    targetId: string
    targetType: string
    startsAt: string | null
    expiresAt: string | null
  }
}

export interface InstalmentDto {
  id: string
  amount: string
  dueDate: string
  paidAt: string | null
  status: "pending" | "paid" | "overdue"
  transactionId: string | null
}

export interface InstalmentScheduleResponse {
  accessRule: string
  instalments: InstalmentDto[]
  orderAmount: string | null
  orderId: string
  paidTotal: string
}

export interface OrderBumpResponse {
  orderId: string
  courseId: string
  courseTitle: string
  newOrderAmount: string
}

export interface AbandonedCartDto {
  id: string
  items: Array<{ courseId?: string; bundleId?: string }>
  recovered: boolean
  recoveredAt: string | null
  startedAt: string
  studentEmail: string | null
  studentName: string | null
  userId: string
}

export interface AbandonedCartListResponse {
  carts: AbandonedCartDto[]
}

export interface RefundEstimateResponse {
  orderId: string
  kind: string
  eligible: boolean
  estimatedAmount: number | string | null
  rule: string
}

export interface SellerDashboardResponse {
  sales: {
    total: number
    paid: number
    pending: number
    refunded: number
    rejected: number
  }
  refundTotal: number
  payoutBalance: {
    availableBalance: number
    reservedAmount: number
    totalRevenue: number
    pendingPayoutRequestCount: number
  }
  ordersByPaymentMethod: Array<{
    paymentMethod: string
    count: number
    total: number
  }>
  couponPerformance: Array<{
    couponCode: string
    uses: number
    discountGiven: number
    revenue: number
  }>
  enrolmentsPerCourse: Array<{
    courseId: string
    courseTitle: string
    enrolments: number
    activeEnrolments: number
  }>
  completionPerCourse: Array<{
    courseId: string
    courseTitle: string
    completedEnrolments: number
    completionRate: number
  }>
  dropOffPerCourse: Array<{
    courseId: string
    courseTitle: string
    dropOffLesson: {
      lectureId: string
      lectureTitle: string
      rateAfter: number
      rateBefore: number
    } | null
  }>
  topicWeakness: {
    note: string
    source: string
    quizzes: Array<{
      quizId: string
      quizTitle: string
      courseId: string
      courseTitle: string
      attempts: number
      averagePercentage: number | null
    }>
  }
  atRiskStudents: Array<{
    courseId: string
    courseTitle: string
    enrolledAt: string
    lastActivityAt: string
    reason: string
    studentEmail: string
    studentName: string | null
    userId: string
  }>
}

export interface AnnouncementDraftResponse {
  draft: { body: string; courseId: string | null; title: string }
  note?: string
  recipientCount: number
  recipientsPreview: Array<{
    email?: string
    fullName?: string | null
    userId?: string
  }>
  sent: false
}

export interface QuestionBankOptionDto {
  id: string
  isCorrect: boolean
  optionText: string
  position: number
}

export interface QuestionBankQuestionDto {
  id: string
  questionText: string
  subject: string | null
  chapter: string | null
  topic: string | null
  difficulty: string
  explanation: string | null
  courseId: string | null
  options: QuestionBankOptionDto[]
}

export interface QuestionBankListResponse {
  questions: QuestionBankQuestionDto[]
}

export interface QuestionImportResponse {
  attachedToTestId: string | null
  errors: Array<{ line: number; reason: string }>
  imported: number
  skipped: number
}

export interface ModelTestDto {
  id: string
  title: string
  courseId: string
  durationMinutes: number
  negativeMark: string | number
  shuffleQuestions: boolean
  maxAttempts: number
  isPublished?: boolean
  questionCount?: number
}

export interface ModelTestAttemptDto {
  attemptId: string
  durationMinutes: number
  startedAt: string
  expiresAt: string
  testId: string
  title: string
  questions: Array<{
    id: string
    questionText: string
    subject: string | null
    chapter: string | null
    topic: string | null
    difficulty: string | null
    options: Array<{ id: string; optionText: string }>
  }>
}

export interface ModelTestSubmitResponse {
  attemptId: string
  score: number
  totalQuestions: number
  correctCount: number
  wrongCount: number
  blankCount: number
  percentage: number
  negativeMark: number
  negativeMarkApplied: number
  topicBreakdown: Record<
    string,
    { blank: number; correct: number; total: number; wrong: number }
  >
  wrongQuestionIds: string[]
  submittedLate: boolean
  finishedInSeconds: number
}

export interface LeaderboardEntryDto {
  rank: number
  score: number
  studentName: string | null
  studentEmail?: string | null
  userId: string
  finishedInSeconds: number | null
  submittedAt: string
}

export interface LeaderboardResponse {
  testId: string
  leaderboard: LeaderboardEntryDto[]
  ownEntry?: LeaderboardEntryDto | null
  ownRank?: number | null
  tiebreak?: string
}

export interface TopicReportResponse {
  testId: string
  attemptsCount: number
  topics: Array<{
    topic: string
    correct: number
    wrong: number
    blank: number
    total: number
    accuracy: number
  }>
}

export interface MistakeBankResponse {
  questions: Array<QuestionBankQuestionDto & { sourceTestIds: string[] }>
}

/* ------------------------------------------------------------------ */
/* Batch 4 — batches, affiliates, link-based live classes, revision.  */
/* Shapes follow the backend API contract exactly where the contract  */
/* fixes a shape; every other field is optional so a page never       */
/* crashes on a field the backend does not return.                    */
/* ------------------------------------------------------------------ */

export interface BatchDto {
  id: string
  courseId?: string | null
  courseTitle?: string | null
  name: string
  enrolmentStartAt?: string | null
  enrolmentEndAt?: string | null
  memberCount?: number | null
  createdAt?: string | null
}

export interface BatchListResponse {
  batches: BatchDto[]
}

export interface BatchMemberDto {
  userId: string
  fullName?: string | null
  studentName?: string | null
}

export interface BatchDetailResponse {
  batch?: BatchDto
  members?: BatchMemberDto[]
  id?: string
  courseId?: string | null
  courseTitle?: string | null
  name?: string
  enrolmentStartAt?: string | null
  enrolmentEndAt?: string | null
  memberCount?: number | null
  createdAt?: string | null
}

export interface DripStatusItemDto {
  milestoneId?: string | null
  moduleId?: string | null
  locked: boolean
  unlocksAt?: string | null
}

export interface DripStatusResponse {
  items: DripStatusItemDto[]
}

export interface BatchLeaderboardEntryDto {
  userId: string
  displayName?: string | null
  studentName?: string | null
  rank?: number | null
  score?: number | string | null
  progress?: number | string | null
  /* Deliberately no email: a batch leaderboard never shows another
     student's email address. */
}

export interface BatchLeaderboardResponse {
  leaderboard?: BatchLeaderboardEntryDto[]
  entries?: BatchLeaderboardEntryDto[]
}

export interface BatchAnnouncementResponse {
  announcement?: { id?: string; title: string; body: string }
  recipientCount: number
  sent: boolean
}

export interface AffiliateLinkDto {
  id: string
  code: string
  commissionType: "percent" | "flat"
  commissionValue: string | number
  scopeType?: string | null
  scopeId?: string | null
  isReferral?: boolean | null
  clicks?: number | null
  conversions?: number | null
  earned?: string | number | null
  createdAt?: string | null
}

export interface AffiliateLinkListResponse {
  links: AffiliateLinkDto[]
}

export interface AffiliateDashboardResponse {
  clicks?: number | null
  conversions?: number | null
  totalCommission?: string | number | null
  pendingCommission?: string | number | null
  paidCommission?: string | number | null
  availableBalance?: string | number | null
  earnings?: string | number | null
  links?: AffiliateLinkDto[] | null
}

export interface AffiliatePayoutDto {
  id: string
  amount: string | number
  note?: string | null
  status: string
  userId?: string | null
  userName?: string | null
  createdAt?: string | null
  decidedAt?: string | null
}

export interface AffiliatePayoutListResponse {
  payouts: AffiliatePayoutDto[]
}

export interface LiveClassDto {
  id: string
  courseId?: string | null
  courseTitle?: string | null
  batchId?: string | null
  title: string
  startsAt: string
  endsAt?: string | null
  meetingUrl: string
  provider: "meet" | "zoom" | "other"
  recordingUrl?: string | null
  recordingTitle?: string | null
  createdAt?: string | null
}

export interface LiveClassListResponse {
  liveClasses: LiveClassDto[]
}

export interface LiveClassAttendanceDto {
  userId: string
  studentName?: string | null
  present: boolean
  markedAt?: string | null
}

export interface LiveClassAttendanceResponse {
  attendance: LiveClassAttendanceDto[]
}

export interface FlashcardDto {
  id: string
  front: string
  back: string
  subject?: string | null
  chapter?: string | null
  topic?: string | null
  dueAt?: string | null
  nextReviewAt?: string | null
}

export interface FlashcardListResponse {
  flashcards: FlashcardDto[]
}

export interface RevisionTodayResponse {
  dueFlashcards: FlashcardDto[]
  dueCount: number
  weakTopicRecommendations: Array<
    string | { topic?: string | null; reason?: string | null }
  >
}

export interface BookmarkDto {
  id: string
  type: "question" | "lesson"
  targetId: string
  title?: string | null
  createdAt?: string | null
}

export interface BookmarkListResponse {
  bookmarks: BookmarkDto[]
}

export interface NoteDto {
  id: string
  lessonId?: string | null
  questionId?: string | null
  body: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface NoteListResponse {
  notes: NoteDto[]
}

export interface RevisionSummaryResponse {
  dueCount?: number | null
  flashcardCount?: number | null
  bookmarkCount?: number | null
  noteCount?: number | null
  weakTopics?: string[] | null
}

// --- Course reviews (public read, student write, teacher/admin reply) ---

export interface CourseReviewReplyDto {
  id: string
  body: string
  authorRole: string
  authorName: string | null
  createdAt: string
}

export interface CourseReviewDto {
  id: string
  rating: number
  body: string | null
  reviewerName: string
  createdAt: string
  replies: CourseReviewReplyDto[]
}

export interface CourseReviewsResponse {
  averageRating: number | null
  reviewCount: number
  reviews: CourseReviewDto[]
}

export interface CourseMyReviewResponse {
  review: CourseReviewDto | null
  canReview: boolean
}

// --- Student refund requests ---

export type RefundRequestStatus = RefundStatus

export interface StudentRefundRequestDto {
  id: string
  orderId: string
  courseTitle: string | null
  amount: string
  currency: string
  reason: string
  status: RefundRequestStatus
  createdAt: string
}

export interface StudentRefundRequestListResponse {
  refunds: StudentRefundRequestDto[]
}

export interface InstructorRefundRequestDto {
  id: string
  orderId: string
  studentName: string
  courseTitle: string
  amount: string
  currency: string
  reason: string
  status: RefundRequestStatus
  createdAt: string
}

export interface InstructorRefundRequestListResponse {
  refunds: InstructorRefundRequestDto[]
}

// --- Admin analytics ---

export interface AnalyticsFunnelStepDto {
  key: string
  label: string
  count: number
  /** Fraction 0–1 from the previous step; computed client-side when absent. */
  conversionRate?: number | null
}

export interface AnalyticsFunnelResponse {
  signups: number
  paidOrders: number
  completedCourses: number
  /** Percent 0–100 vs previous step. */
  signupToPaidPct: number
  /** Percent 0–100 vs previous step. */
  paidToCompletedPct: number
  note: string
}

export interface AnalyticsCohortDto {
  month: string
  enrolled: number
  completedPct: number | null
  refundPct: number | null
}

export interface AnalyticsCohortsResponse {
  cohorts: AnalyticsCohortDto[]
}

export interface AnalyticsRefundReasonDto {
  reason: string
  count: number
}

export interface AnalyticsRefundReasonsResponse {
  reasons: AnalyticsRefundReasonDto[]
}

export interface AnalyticsTeacherDto {
  teacherId: string
  teacherName: string
  courseCount?: number | null
  sales: number | string
  completionPct: number | null
  avgRating: number | null
  refundPct: number | null
}

export interface AnalyticsTeachersResponse {
  teachers: AnalyticsTeacherDto[]
}

/* ------------------------------------------------------------------ */
/* Batch 6 — notification center + instructor↔student messaging.       */
/* Shapes follow the backend API contract exactly.                     */
/* ------------------------------------------------------------------ */

/** GET /notifications/unread-count */
export interface UnreadCountResponse {
  unreadCount: number
}

/** POST /notifications/:id/read */
export interface NotificationMarkReadResponse {
  id: string
  readAt: string
}

/** POST /notifications/read-all */
export interface NotificationMarkAllReadResponse {
  marked: number
}

export interface MessageThreadDto {
  id: string
  courseId: string
  courseTitle: string
  otherPartyName: string
  otherPartyRole: string
  subject: string
  lastMessageAt: string
  lastMessagePreview: string
  unreadCount: number
}

/** GET /messages/threads */
export interface MessageThreadListResponse {
  threads: MessageThreadDto[]
}

export interface MessageDto {
  id: string
  senderId: string
  senderRole: string
  senderName: string
  body: string
  readAt: string | null
  createdAt: string
}

/** GET /messages/threads/:id */
export interface MessageThreadDetailResponse {
  thread: MessageThreadDto
  messages: MessageDto[]
}

/** POST /messages/threads {courseId, studentId?, subject, body} */
export interface MessageThreadCreateResponse {
  thread: MessageThreadDto
}

/** POST /messages/threads/:id/messages {body} */
export interface MessageSendResponse {
  message: MessageDto
}

/** POST /instructor/messages/broadcast {courseId?, batchId?, subject, body} */
export interface MessageBroadcastResponse {
  threadsCreated: number
  notified: number
}
