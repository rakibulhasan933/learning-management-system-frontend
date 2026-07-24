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
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link className="flex items-center gap-2.5" href="/">
          <span className="flex h-7 w-7 items-center justify-center border border-primary font-mono text-[11px] text-primary">
            F
          </span>
          <span className="font-display text-lg tracking-tight">Folio</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link
            className="text-muted-foreground transition-colors hover:text-foreground"
            href="/courses"
          >
            Courses
          </Link>
          {profile ? (
            <>
              <Link
                className="text-muted-foreground transition-colors hover:text-foreground"
                href="/dashboard/student"
              >
                Learning
              </Link>
              <Link
                className="text-muted-foreground transition-colors hover:text-foreground"
                href="/dashboard/profile"
              >
                Profile
              </Link>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <Link
                className="hidden border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/50 md:inline-flex"
                href="/dashboard/profile"
              >
                Profile settings
              </Link>
              <Link
                className="inline-flex items-center gap-2.5 border border-primary/60 px-3 py-1.5 text-sm text-primary transition-colors hover:border-primary"
                href="/dashboard/profile"
              >
                <span className="relative h-7 w-7 overflow-hidden rounded-full border border-primary/50 bg-card">
                  {profile.avatarUrl ? (
                    <Image
                      alt={profile.fullName ?? profile.email}
                      className="object-cover"
                      fill
                      sizes="28px"
                      src={profile.avatarUrl}
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center font-mono text-xs text-primary">
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
                className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
                href="/auth/login"
              >
                Sign in
              </Link>
              <Link
                className="border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
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