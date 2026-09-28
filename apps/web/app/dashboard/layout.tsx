import type { ReactNode } from "react"

import type { ProfileDto } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

import { AdminDashboardShell } from "./admin-dashboard-shell"
import { InstructorDashboardShell } from "./instructor-dashboard-shell"
import { StudentDashboardShell } from "./student-dashboard-shell"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const profile = await authenticatedApiFetch<ProfileDto>("/auth/me", {
    cache: "no-store",
  })

  if (profile.role === "admin") {
    return (
      <AdminDashboardShell profile={profile}>{children}</AdminDashboardShell>
    )
  }

  if (profile.role === "instructor") {
    return (
      <InstructorDashboardShell profile={profile}>
        {children}
      </InstructorDashboardShell>
    )
  }

  return (
    <StudentDashboardShell profile={profile}>{children}</StudentDashboardShell>
  )
}
