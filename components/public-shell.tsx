import type { ReactNode } from "react"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export function PublicShell({
  children,
  variant = "default",
}: {
  children: ReactNode
  variant?: "default" | "home"
}) {
  return (
    <div className={`flex min-h-screen flex-col bg-background text-foreground ${variant === "home" ? "folio-home-shell" : ""}`}>
      <SiteHeader variant={variant} />
      <div className="flex-1">{children}</div>
      <SiteFooter variant={variant} />
    </div>
  )
}
