import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"
import { ProgressThread } from "@workspace/ui/components/progress-thread"

type StatTileProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** Sentence-case caption above the figure. */
  label: React.ReactNode
  /** The figure itself. Always rendered mono + tabular so columns line up. */
  value: React.ReactNode
  /** Optional glyph, pinned top-right away from the figure. */
  icon?: React.ReactNode
  /** 0-100. Renders the signature thread as a meter under the figure. */
  meter?: number
  /** Small mono note under the figure, e.g. "of 42 enrolled". */
  hint?: React.ReactNode
  /**
   * "primary" reserves brass gold for the one figure that matters most on a
   * page; "secondary" is teal for supporting figures.
   */
  tone?: "default" | "primary" | "secondary"
}

const toneClass: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "text-foreground",
  primary: "text-primary",
  secondary: "text-secondary",
}

/**
 * One stat tile for every KPI in the app: mono tabular figure, muted label,
 * optional meter. Figures are never zero-padded.
 */
function StatTile({
  className,
  hint,
  icon,
  label,
  meter,
  tone = "default",
  value,
  ...props
}: StatTileProps) {
  return (
    <div
      data-slot="stat-tile"
      className={cn(
        "rounded-2xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow duration-300 hover:ring-primary/30",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon ? (
          <span className="shrink-0 text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "mt-3 font-mono text-3xl tracking-tight tabular-nums",
          toneClass[tone]
        )}
      >
        {value}
      </p>

      {typeof meter === "number" ? (
        <ProgressThread className="mt-4 w-full" value={meter} />
      ) : null}

      {hint ? (
        <p className="mt-3 font-mono text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export { StatTile }
