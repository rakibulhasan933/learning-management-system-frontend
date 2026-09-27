import type { ReactNode } from "react"
import {
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import type {
  CourseStatus,
  EnrollmentStatus,
  OrderStatus,
  PayoutStatus,
  UserRole,
} from "@workspace/types"

import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import {
  courseStatusMeta,
  enrollmentStatusMeta,
  fallbackStatusMeta,
  orderStatusMeta,
  payoutStatusMeta,
  userRoleMeta,
  type StatusMeta,
  type StatusTone,
  type StatusVariant,
} from "@/lib/status"

/**
 * The one status pill for the whole app. Tone carries the meaning, `variant`
 * separates in-flight from terminal, and every pill pairs colour with a label
 * so the state survives greyscale and colour-blindness.
 */

const quietTone: Record<StatusTone, string> = {
  neutral: "border-border text-muted-foreground",
  positive: "border-secondary/40 text-secondary",
  critical: "border-destructive/40 text-destructive",
  accent: "border-primary/40 text-primary",
}

const softTone: Record<StatusTone, string> = {
  neutral: "border-border bg-foreground/5 text-muted-foreground",
  positive: "border-secondary/50 bg-secondary/10 text-secondary",
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  accent: "border-primary/40 bg-primary/10 text-primary",
}

const solidTone: Record<StatusTone, string> = {
  neutral: "border-transparent bg-muted-foreground/20 text-foreground",
  positive: "border-transparent bg-secondary text-secondary-foreground",
  critical: "border-transparent bg-destructive text-background",
  accent: "border-transparent bg-primary text-primary-foreground",
}

const variantTone: Record<StatusVariant, Record<StatusTone, string>> = {
  quiet: quietTone,
  soft: softTone,
  solid: solidTone,
}

const dotTone: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground",
  positive: "bg-secondary",
  critical: "bg-destructive",
  accent: "bg-primary",
}

type StatusPillProps = StatusMeta & {
  /** Optional glyph. Rendered in place of the dot. */
  icon?: ReactNode
  className?: string
}

function StatusPill({
  className,
  icon,
  label,
  tone,
  variant,
}: StatusPillProps) {
  return (
    <Badge
      className={cn(
        "gap-1.5 border font-mono text-xs tracking-wide",
        variantTone[variant][tone],
        className
      )}
      variant="outline"
    >
      {icon ? (
        <span className="[&_svg]:size-3">{icon}</span>
      ) : (
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            variant === "solid" ? "bg-current" : dotTone[tone]
          )}
        />
      )}
      {label}
    </Badge>
  )
}

/**
 * Domain wrappers. Pages import these, never the raw maps, so a status can
 * only ever be rendered one way.
 */

function PayoutStatusPill({
  status,
  className,
}: {
  status: PayoutStatus | string
  className?: string
}) {
  const meta =
    payoutStatusMeta[status as PayoutStatus] ?? fallbackStatusMeta(status)
  const icons: Record<PayoutStatus, ReactNode> = {
    pending: <Clock3 />,
    approved: <ShieldCheck />,
    paid: <CheckCircle2 />,
    rejected: <XCircle />,
  }

  return (
    <StatusPill
      {...meta}
      className={className}
      icon={icons[status as PayoutStatus]}
    />
  )
}

function OrderStatusPill({
  status,
  className,
}: {
  status: OrderStatus | string
  className?: string
}) {
  const meta =
    orderStatusMeta[status as OrderStatus] ?? fallbackStatusMeta(status)

  return <StatusPill {...meta} className={className} />
}

function CourseStatusPill({
  status,
  className,
}: {
  status: CourseStatus | string
  className?: string
}) {
  const meta =
    courseStatusMeta[status as CourseStatus] ?? fallbackStatusMeta(status)
  const icons: Record<CourseStatus, ReactNode> = {
    draft: <FileText />,
    pending_review: <Clock3 />,
    published: <CheckCircle2 />,
    archived: <XCircle />,
  }

  return (
    <StatusPill
      {...meta}
      className={className}
      icon={icons[status as CourseStatus]}
    />
  )
}

function EnrollmentStatusPill({
  status,
  className,
}: {
  status: EnrollmentStatus | string
  className?: string
}) {
  const meta =
    enrollmentStatusMeta[status as EnrollmentStatus] ??
    fallbackStatusMeta(status)

  return <StatusPill {...meta} className={className} />
}

function UserRolePill({
  role,
  className,
}: {
  role: UserRole | string
  className?: string
}) {
  const meta = userRoleMeta[role as UserRole] ?? fallbackStatusMeta(role)

  return <StatusPill {...meta} className={className} />
}

export {
  CourseStatusPill,
  EnrollmentStatusPill,
  OrderStatusPill,
  PayoutStatusPill,
  StatusPill,
  UserRolePill,
}
