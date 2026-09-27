import Link from "next/link"
import Image from "next/image"
import { Menu } from "lucide-react"
import type { ProfileDto } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { getDashboardPath } from "@/lib/auth/dashboard"
import { Button } from "@workspace/ui/components/button"

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
    profile?.fullName?.trim()?.[0] ?? profile?.email?.[0] ?? "L"
  ).toUpperCase()
  const dashboardPath = profile ? getDashboardPath(profile.role) : null

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link className="flex min-w-0 items-center gap-2.5" href="/">
          <span className="flex size-7 items-center justify-center rounded-lg font-mono text-[11px] text-primary ring-1 ring-primary/60">
            F
          </span>
          <span className="font-heading text-lg tracking-tight">Folio</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link
            className="interactive-link text-muted-foreground"
            href="/"
          >
            Home
          </Link>
          <Link
            className="interactive-link text-muted-foreground"
            href="/courses"
          >
            Courses
          </Link>
          <Link
            className="interactive-link text-muted-foreground"
            href="/about"
          >
            About
          </Link>
          <Link
            className="interactive-link text-muted-foreground"
            href="/faq"
          >
            FAQ
          </Link>
          <Link
            className="interactive-link text-muted-foreground"
            href="/contact"
          >
            Contact
          </Link>
          {profile ? (
            <>
              <Link
                className="interactive-link text-muted-foreground"
                href={dashboardPath ?? "/dashboard/student"}
              >
                Dashboard
              </Link>
              <Link
                className="interactive-link text-muted-foreground"
                href="/dashboard/profile"
              >
                Profile
              </Link>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-3 md:flex">
            {profile ? (
              <>
                <Button
                  className="hidden md:inline-flex"
                  asChild
                  variant="outline"
                >
                  <Link href="/dashboard/profile">Profile settings</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={dashboardPath ?? "/dashboard/profile"} className="inline-flex items-center gap-2">
                    <span className="relative size-7 overflow-hidden rounded-full bg-card ring-1 ring-primary/50">
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
                    <span>Account</span>
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Link
                  className="interactive-link hidden text-sm text-muted-foreground md:inline-flex"
                  href="/auth/login"
                >
                  Sign in
                </Link>
                <Button asChild>
                  <Link href="/auth/signup">Create account</Link>
                </Button>
              </>
            )}
          </div>

          <details className="relative md:hidden">
            <summary className="list-none">
              <span className="interactive-surface inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground ring-1 ring-foreground/10">
                <Menu className="size-4" />
                Menu
              </span>
            </summary>
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
              <nav className="grid gap-2 text-sm">
                <Button className="justify-start" asChild variant="ghost">
                  <Link href="/">Home</Link>
                </Button>
                <Button
                  className="justify-start"
                  asChild
                  variant="ghost"
                >
                  <Link href="/courses">Courses</Link>
                </Button>
                <Button className="justify-start" asChild variant="ghost">
                  <Link href="/about">About</Link>
                </Button>
                <Button className="justify-start" asChild variant="ghost">
                  <Link href="/faq">FAQ</Link>
                </Button>
                <Button className="justify-start" asChild variant="ghost">
                  <Link href="/contact">Contact</Link>
                </Button>
                {profile ? (
                  <>
                    <Button
                      className="justify-start"
                      asChild
                      variant="ghost"
                    >
                      <Link href={dashboardPath ?? "/dashboard/student"}>Dashboard</Link>
                    </Button>
                    <Button
                      className="justify-start"
                      asChild
                      variant="ghost"
                    >
                      <Link href="/dashboard/profile">Profile</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="justify-start"
                      asChild
                      variant="ghost"
                    >
                      <Link href="/auth/login">Sign in</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/auth/signup">Create account</Link>
                    </Button>
                  </>
                )}
              </nav>
            </div>
          </details>

        </div>
      </div>
    </header>
  )
}
