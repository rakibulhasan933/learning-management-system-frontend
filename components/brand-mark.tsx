import Link from "next/link"

import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-baseline text-2xl font-semibold tracking-normal",
        className
      )}
    >
      Folio
      <span
        aria-hidden
        className="ml-1 inline-block size-2 rounded-full bg-destructive"
      />
    </Link>
  )
}
