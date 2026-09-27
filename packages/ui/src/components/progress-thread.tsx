import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type ProgressThreadProps = React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical"
  /** 0-100. When set, the thread reads as a completion indicator. */
  value?: number
}

/**
 * The signature "progress thread": a thin brass line reused across nav, hero,
 * and section dividers so progress always reads the same way.
 */
function ProgressThread({
  className,
  orientation = "horizontal",
  value,
  ...props
}: ProgressThreadProps) {
  const isMeter = typeof value === "number"
  const clamped = isMeter ? Math.min(100, Math.max(0, value)) : 100

  return (
    <div
      data-slot="progress-thread"
      data-orientation={orientation}
      aria-hidden={isMeter ? undefined : true}
      role={isMeter ? "progressbar" : undefined}
      aria-valuenow={isMeter ? clamped : undefined}
      aria-valuemin={isMeter ? 0 : undefined}
      aria-valuemax={isMeter ? 100 : undefined}
      className={cn(
        "overflow-hidden",
        orientation === "horizontal" ? "h-px w-28" : "h-28 w-px",
        isMeter ? "bg-primary/15" : "bg-primary",
        className
      )}
      {...props}
    >
      {isMeter ? (
        <div
          className={cn(
            "bg-primary transition-[width,height] duration-500 ease-out",
            orientation === "horizontal" ? "h-full" : "w-full"
          )}
          style={
            orientation === "horizontal"
              ? { width: `${clamped}%` }
              : { height: `${clamped}%` }
          }
        />
      ) : null}
    </div>
  )
}

export { ProgressThread }
