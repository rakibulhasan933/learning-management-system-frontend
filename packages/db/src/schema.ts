import { relations, sql } from "drizzle-orm"
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import {
  authProviders,
  courseLevels,
  courseStatuses,
  enrollmentStatuses,
  orderStatuses,
  paymentMethods,
  userRoles,
  videoProviders,
} from "@workspace/types"

export const authProviderEnum = pgEnum("auth_provider", authProviders)
export const userRoleEnum = pgEnum("user_role", userRoles)
export const courseLevelEnum = pgEnum("course_level", courseLevels)
export const courseStatusEnum = pgEnum("course_status", courseStatuses)
export const videoProviderEnum = pgEnum("video_provider", videoProviders)
export const enrollmentStatusEnum = pgEnum(
  "enrollment_status",
  enrollmentStatuses,
)
export const orderStatusEnum = pgEnum("order_status", orderStatuses)
export const paymentMethodEnum = pgEnum("payment_method", paymentMethods)

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  googleId: text("google_id"),
  authProvider: authProviderEnum("auth_provider").notNull().default("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("users_email_unique").on(table.email),
  uniqueIndex("users_google_id_unique").on(table.googleId),
])

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull().default("student"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [uniqueIndex("profiles_user_id_unique").on(table.userId)])

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("refresh_tokens_token_hash_unique").on(table.tokenHash),
  index("refresh_tokens_user_id_idx").on(table.userId),
])

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("password_reset_tokens_token_hash_unique").on(table.tokenHash),
  index("password_reset_tokens_user_id_idx").on(table.userId),
])

export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("email_verification_tokens_token_hash_unique").on(table.tokenHash),
  index("email_verification_tokens_user_id_idx").on(table.userId),
])

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  instructorId: uuid("instructor_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  shortDescription: text("short_description"),
  description: text("description"),
  category: varchar("category", { length: 120 }),
  level: courseLevelEnum("level").notNull().default("all_levels"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("BDT"),
  thumbnailUrl: text("thumbnail_url"),
  status: courseStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("courses_slug_unique").on(table.slug),
  index("courses_instructor_id_idx").on(table.instructorId),
  index("courses_status_idx").on(table.status),
  check("courses_price_non_negative", sql`${table.price} >= 0`),
])

export const sections = pgTable("sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  position: integer("position").notNull(),
  dripAfterDays: integer("drip_after_days").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("sections_course_position_unique").on(
    table.courseId,
    table.position,
  ),
  check("sections_position_non_negative", sql`${table.position} >= 0`),
  check("sections_drip_after_days_non_negative", sql`${table.dripAfterDays} >= 0`),
])

export const lectures = pgTable("lectures", {
  id: uuid("id").defaultRandom().primaryKey(),
  sectionId: uuid("section_id")
    .notNull()
    .references(() => sections.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  position: integer("position").notNull(),
  videoProvider: videoProviderEnum("video_provider").notNull().default("r2"),
  // This is an R2 object key today, not a public URL. The backend resolves it later.
  videoRef: text("video_ref"),
  durationSeconds: integer("duration_seconds"),
  isPreview: boolean("is_preview").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
  availableAt: timestamp("available_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("lectures_section_position_unique").on(
    table.sectionId,
    table.position,
  ),
  check("lectures_position_non_negative", sql`${table.position} >= 0`),
  check(
    "lectures_duration_seconds_non_negative",
    sql`${table.durationSeconds} is null or ${table.durationSeconds} >= 0`,
  ),
])

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("BDT"),
  referenceCode: varchar("reference_code", { length: 64 }).notNull(),
  status: orderStatusEnum("status")
    .notNull()
    .default("pending_verification"),
  paymentMethod: paymentMethodEnum("payment_method"),
  transactionId: varchar("transaction_id", { length: 255 }),
  senderNumber: varchar("sender_number", { length: 64 }),
  proofScreenshotUrl: text("proof_screenshot_url"),
  reviewedBy: uuid("reviewed_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("orders_reference_code_unique").on(table.referenceCode),
  index("orders_user_id_idx").on(table.userId),
  index("orders_course_id_idx").on(table.courseId),
  index("orders_status_created_at_idx").on(table.status, table.createdAt),
  check("orders_amount_non_negative", sql`${table.amount} >= 0`),
])

export const enrollments = pgTable("enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "restrict" }),
  orderId: uuid("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  status: enrollmentStatusEnum("status").notNull().default("active"),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("enrollments_user_course_unique").on(table.userId, table.courseId),
  uniqueIndex("enrollments_order_id_unique").on(table.orderId),
  index("enrollments_course_id_idx").on(table.courseId),
])

export const progress = pgTable("progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  lectureId: uuid("lecture_id")
    .notNull()
    .references(() => lectures.id, { onDelete: "cascade" }),
  positionSeconds: integer("position_seconds").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  lastWatchedAt: timestamp("last_watched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("progress_user_lecture_unique").on(table.userId, table.lectureId),
  index("progress_lecture_id_idx").on(table.lectureId),
  check("progress_position_seconds_non_negative", sql`${table.positionSeconds} >= 0`),
])

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles),
  refreshTokens: many(refreshTokens),
  passwordResetTokens: many(passwordResetTokens),
  emailVerificationTokens: many(emailVerificationTokens),
}))

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  courses: many(courses, { relationName: "course_instructor" }),
  enrollments: many(enrollments),
  studentOrders: many(orders, { relationName: "order_student" }),
  reviewedOrders: many(orders, { relationName: "order_reviewer" }),
  progress: many(progress),
}))

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(profiles, {
    fields: [courses.instructorId],
    references: [profiles.id],
    relationName: "course_instructor",
  }),
  sections: many(sections),
  enrollments: many(enrollments),
  orders: many(orders),
}))

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  course: one(courses, {
    fields: [sections.courseId],
    references: [courses.id],
  }),
  lectures: many(lectures),
}))

export const lecturesRelations = relations(lectures, ({ one, many }) => ({
  section: one(sections, {
    fields: [lectures.sectionId],
    references: [sections.id],
  }),
  progress: many(progress),
}))

export const ordersRelations = relations(orders, ({ one }) => ({
  student: one(profiles, {
    fields: [orders.userId],
    references: [profiles.id],
    relationName: "order_student",
  }),
  course: one(courses, {
    fields: [orders.courseId],
    references: [courses.id],
  }),
  reviewer: one(profiles, {
    fields: [orders.reviewedBy],
    references: [profiles.id],
    relationName: "order_reviewer",
  }),
  enrollment: one(enrollments),
}))

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(profiles, {
    fields: [enrollments.userId],
    references: [profiles.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  order: one(orders, {
    fields: [enrollments.orderId],
    references: [orders.id],
  }),
}))

export const progressRelations = relations(progress, ({ one }) => ({
  student: one(profiles, {
    fields: [progress.userId],
    references: [profiles.id],
  }),
  lecture: one(lectures, {
    fields: [progress.lectureId],
    references: [lectures.id],
  }),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type RefreshToken = typeof refreshTokens.$inferSelect
export type NewRefreshToken = typeof refreshTokens.$inferInsert
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect
export type NewEmailVerificationToken = typeof emailVerificationTokens.$inferInsert
export type Course = typeof courses.$inferSelect
export type NewCourse = typeof courses.$inferInsert
export type Section = typeof sections.$inferSelect
export type NewSection = typeof sections.$inferInsert
export type Lecture = typeof lectures.$inferSelect
export type NewLecture = typeof lectures.$inferInsert
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type Enrollment = typeof enrollments.$inferSelect
export type NewEnrollment = typeof enrollments.$inferInsert
export type Progress = typeof progress.$inferSelect
export type NewProgress = typeof progress.$inferInsert
