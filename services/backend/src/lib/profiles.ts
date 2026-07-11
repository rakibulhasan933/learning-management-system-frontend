import { eq, profiles, users } from "@workspace/db"
import type { ProfileDto } from "@workspace/types"

import { db } from "./database.js"

type ProfileWithUser = typeof profiles.$inferSelect & {
  email: string
}

export function toProfileDto(profile: ProfileWithUser): ProfileDto {
  return {
    avatarUrl: profile.avatarUrl,
    email: profile.email,
    fullName: profile.fullName,
    id: profile.id,
    role: profile.role,
  }
}

export async function getProfileByUserId(userId: string) {
  const [row] = await db
    .select({
      avatarUrl: profiles.avatarUrl,
      createdAt: profiles.createdAt,
      email: users.email,
      fullName: profiles.fullName,
      id: profiles.id,
      role: profiles.role,
      updatedAt: profiles.updatedAt,
      userId: profiles.userId,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.userId, userId))
    .limit(1)

  return row ?? null
}
