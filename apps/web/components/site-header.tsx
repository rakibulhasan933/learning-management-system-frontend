import Link from "next/link"
import Image from "next/image"
import type { ProfileDto } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

async function getPublicProfile() {
  try {
    return await authenticatedApiFetch<ProfileDto>("/auth/me", {
      cache: "no-store",
    })
  } catch {
    return null
  }
}

export async function SiteHeader() {
  const profile = await getPublicProfile()
  const initials = (
    profile?.fullName?.trim()?.[0] ?? profile?.email[0] ?? "L"
  ).toUpperCase()

  return (
    <header className="border-b border-border bg-background/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link className="flex items-center gap-3" href="/">
          <span className="h-8 w-8 border border-primary bg-card" />
          <span className="text-sm tracking-[0.22em] text-muted-foreground">
            lms
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link className="text-sm text-foreground" href="/courses">
            Courses
          </Link>
          {profile ? (
            <>
              <Link className="text-sm text-foreground" href="/dashboard/student">
                Learning
              </Link>
              <Link className="text-sm text-foreground" href="/dashboard/profile">
                Profile
              </Link>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <Link
                className="hidden border border-border px-4 py-2 text-sm text-foreground md:inline-flex"
                href="/dashboard/profile"
              >
                Profile settings
              </Link>
              <Link
                className="inline-flex items-center gap-3 border border-primary px-3 py-2 text-sm text-primary"
                href="/dashboard/profile"
              >
                <span className="relative h-7 w-7 overflow-hidden rounded-full border border-primary/40 bg-card">
                  {profile.avatarUrl ? (
                    <Image
                      alt={profile.fullName ?? profile.email}
                      className="object-cover"
                      fill
                      sizes="28px"
                      src={profile.avatarUrl}
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs">
                      {initials}
                    </span>
                  )}
                </span>
                <span className="hidden md:inline">Account</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                className="hidden text-sm text-foreground md:inline-flex"
                href="/auth/login"
              >
                Sign in
              </Link>
              <Link
                className="border border-primary px-4 py-2 text-sm text-primary"
                href="/auth/signup"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
