import type {
  CourseStatus,
  EnrollmentStatus,
  OrderStatus,
  PayoutStatus,
  UserRole,
} from "@workspace/types"

/**
 * Every status in the app resolves through this file, so a state can never
 * again look different on two pages.
 *
 * The palette has only brass / teal / destructive / muted, and brass is
 * reserved for CTAs and progress. So tone alone cannot separate every state —
 * `variant` adds a second axis:
 *
 *   soft  = decision made, not yet terminal   (outlined, 10% wash)
 *   solid = terminal, settled                 (filled)
 *   quiet = nothing has happened yet          (muted outline)
 *
 * That is what finally distinguishes `approved` from `paid`, which currently
 * render identically in the admin payout queue.
 */
export type StatusTone = "neutral" | "positive" | "critical" | "accent"
export type StatusVariant = "quiet" | "soft" | "solid"

export interface StatusMeta {
  label: string
  tone: StatusTone
  variant: StatusVariant
}

/**
 * Typed as a total Record so adding a member to any enum in
 * `@workspace/types` becomes a compile error here rather than a silent
 * fallthrough to a default style.
 */
export const payoutStatusMeta: Record<PayoutStatus, StatusMeta> = {
  pending: { label: "Pending", tone: "neutral", variant: "quiet" },
  approved: { label: "Approved", tone: "positive", variant: "soft" },
  paid: { label: "Paid", tone: "positive", variant: "solid" },
  rejected: { label: "Rejected", tone: "critical", variant: "soft" },
}

export const orderStatusMeta: Record<OrderStatus, StatusMeta> = {
  pending_verification: {
    label: "Pending verification",
    tone: "neutral",
    variant: "quiet",
  },
  paid: { label: "Paid", tone: "positive", variant: "solid" },
  rejected: { label: "Rejected", tone: "critical", variant: "soft" },
  expired: { label: "Expired", tone: "critical", variant: "soft" },
  refunded: { label: "Refunded", tone: "neutral", variant: "soft" },
}

export const courseStatusMeta: Record<CourseStatus, StatusMeta> = {
  draft: { label: "Draft", tone: "neutral", variant: "quiet" },
  pending_review: { label: "Pending review", tone: "neutral", variant: "soft" },
  published: { label: "Published", tone: "positive", variant: "solid" },
  archived: { label: "Archived", tone: "critical", variant: "soft" },
}

export const enrollmentStatusMeta: Record<EnrollmentStatus, StatusMeta> = {
  active: { label: "Active", tone: "positive", variant: "solid" },
  revoked: { label: "Revoked", tone: "critical", variant: "soft" },
}

export const userRoleMeta: Record<UserRole, StatusMeta> = {
  admin: { label: "Admin", tone: "accent", variant: "soft" },
  instructor: { label: "Instructor", tone: "positive", variant: "soft" },
  student: { label: "Student", tone: "neutral", variant: "quiet" },
}

/** Display names for payment methods, which are labels rather than statuses. */
export const paymentMethodLabels: Record<string, string> = {
  bank_transfer: "Bank transfer",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  gateway: "Gateway",
}

/**
 * Last-resort label for a status string that isn't in any map (an API value
 * added ahead of the frontend). Sentence case, never raw snake_case.
 */
export function fallbackStatusMeta(status: string): StatusMeta {
  const spaced = status.replaceAll("_", " ")

  return {
    label: spaced.charAt(0).toUpperCase() + spaced.slice(1),
    tone: "neutral",
    variant: "quiet",
  }
}
