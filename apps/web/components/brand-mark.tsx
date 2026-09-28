import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

type BrandMarkProps = {
  className?: string
  href?: string
  size?: "sm" | "md"
}

export function BrandMark({
  className,
  href = "/",
  size = "md",
}: BrandMarkProps) {
  return (
    <Link
      className={cn("flex min-w-0 items-center gap-2.5", className)}
      href={href}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-primary ring-1 ring-primary/45",
          size === "sm" ? "size-7 text-[10px]" : "size-8 text-[11px]"
        )}
      >
        F
      </span>
      <span
        className={cn(
          "font-heading tracking-tight",
          size === "sm" ? "text-base" : "text-lg"
        )}
      >
        Folio
      </span>
    </Link>
  )
}
