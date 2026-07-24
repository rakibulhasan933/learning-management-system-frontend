import type { ReactNode } from "react"

import type { ProfileDto } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

import { DashboardShell } from "./dashboard-shell"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const profile = await authenticatedApiFetch<ProfileDto>("/auth/me", {
    cache: "no-store",
  })

  return <DashboardShell profile={profile}>{children}</DashboardShell>
}
