import type { UserRole } from "@workspace/types"

export const dashboardPaths: Record<UserRole, string> = {
  admin: "/dashboard/admin",
  instructor: "/dashboard/instructor",
  student: "/dashboard/student",
}

export function getDashboardPath(role: UserRole) {
  return dashboardPaths[role]
}
