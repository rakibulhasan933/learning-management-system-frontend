import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"
import { ProgressThread } from "@workspace/ui/components/progress-thread"

type PageHeaderProps = Omit<React.ComponentProps<"header">, "title"> & {
  /** Mono kicker above the title, e.g. "Admin dashboard · Approval queue". */
  eyebrow?: React.ReactNode
  title: React.ReactNode
  /** Supporting sentence under the title. */
  lede?: React.ReactNode
  /** Right-aligned slot for buttons/links. */
  action?: React.ReactNode
  /** The signature gold thread above the eyebrow. */
  thread?: boolean
  /**
   * "compact" trims the display size for pages where a marketing-scale title
   * would push real content below the fold (the learning player).
   */
  size?: "default" | "compact"
}

/**
 * The canonical page header: gold thread, mono eyebrow, Fraunces title, muted
 * lede, optional action. Every page uses this so headers stop drifting apart.
 */
function PageHeader({
  action,
  className,
  eyebrow,
  lede,
  size = "default",
  thread = true,
  title,
  ...props
}: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn("w-full", className)}
      {...props}
    >
      {thread ? (
        <ProgressThread
          className={cn(size === "compact" ? "mb-5 w-16" : "mb-8 w-24")}
        />
      ) : null}

      <div
        className={cn(
          "flex flex-col gap-5",
          action && "sm:flex-row sm:items-end sm:justify-between sm:gap-8"
        )}
      >
        <div className="min-w-0">
          {eyebrow ? (
            <p className="font-mono text-xs tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={cn(
              "font-heading tracking-tight",
              eyebrow && "mt-3",
              size === "compact"
                ? "text-2xl leading-tight sm:text-3xl"
                : "text-4xl leading-[1.05] sm:text-5xl"
            )}
          >
            {title}
          </h1>
          {lede ? (
            <p
              className={cn(
                "max-w-xl text-muted-foreground",
                size === "compact"
                  ? "mt-3 text-sm leading-6"
                  : "mt-5 text-base leading-7"
              )}
            >
              {lede}
            </p>
          ) : null}
        </div>

        {action ? (
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {action}
          </div>
        ) : null}
      </div>
    </header>
  )
}

export { PageHeader }
