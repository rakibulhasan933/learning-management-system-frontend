import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type EmptyStateProps = Omit<React.ComponentProps<"div">, "title"> & {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  /** Give every empty state a way forward where one exists. */
  action?: React.ReactNode
}

/**
 * One empty state for the whole app: dashed frame, ringed icon, sentence-case
 * title, optional next step.
 */
function EmptyState({
  action,
  className,
  description,
  icon,
  title,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      {icon ? (
        <span className="mb-5 flex size-11 items-center justify-center rounded-full text-muted-foreground ring-1 ring-border [&_svg]:size-5">
          {icon}
        </span>
      ) : null}
      <p className="font-heading text-lg tracking-tight">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>
      ) : null}
    </div>
  )
}

export { EmptyState }
