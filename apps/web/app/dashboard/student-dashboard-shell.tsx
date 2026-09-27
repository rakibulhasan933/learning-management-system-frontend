import type { ReactNode } from "react"

import type { ProfileDto } from "@workspace/types"

import { DashboardShell } from "./dashboard-shell"

export function StudentDashboardShell({
  children,
  profile,
}: {
  children: ReactNode
  profile: ProfileDto
}) {
  return <DashboardShell profile={profile}>{children}</DashboardShell>
}
