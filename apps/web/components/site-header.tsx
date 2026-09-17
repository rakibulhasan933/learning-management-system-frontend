import Link from "next/link"
import Image from "next/image"
import type { ProfileDto } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"

export function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <svg
        aria-hidden="true"
        width="33"
        height="33"
        viewBox="0 0 33 33"
        fill="none"
      >
        <path
          d="M5 6v20h23M12 6v13h16M19 6v6h9"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-primary"
        />
      </svg>
      <span className="text-[25px] font-semibold tracking-[-.07em] text-foreground">
        lms<span className="text-primary">.</span>
      </span>
    </span>
  )
}

export async function SiteHeader() {
  const profile = await authenticatedApiFetch<ProfileDto>("/auth/me", {
    cache: "no-store",
  }).catch(() => null)
  const initials = (
    profile?.fullName?.trim()?.[0] ??
    profile?.email[0] ??
    "L"
  ).toUpperCase()
  const links = [
    { href: "/courses", label: "Explore courses" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#for-instructors", label: "For instructors" },
  ]

  return (
    <header className="relative z-20 border-b border-border bg-background">
      <div className="page-container flex h-[88px] items-center justify-between gap-5">
        <Link href="/" aria-label="LMS home">
          <BrandMark />
        </Link>
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-9 lg:flex"
        >
          {links.map((link) => (
            <Link className="nav-link" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-6">
          {profile ? (
            <>
              <Link
                className="nav-link hidden sm:inline-flex"
                href={`/dashboard/${profile.role}`}
              >
                My workspace
              </Link>
              <Link
                className="flex items-center gap-2.5 rounded-full border border-border p-1.5 pr-3 text-xs"
                href="/dashboard/profile"
              >
                <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-card text-primary">
                  {profile.avatarUrl ? (
                    <Image
                      alt={profile.fullName ?? profile.email}
                      className="object-cover"
                      fill
                      sizes="32px"
                      src={profile.avatarUrl}
                    />
                  ) : (
                    initials
                  )}
                </span>
                Account
              </Link>
            </>
          ) : (
            <>
              <Link
                className="nav-link hidden sm:inline-flex"
                href="/auth/login"
              >
                Sign in
              </Link>
              <Link
                className="button-primary !gap-4 !px-4 !py-2.5"
                href="/auth/signup"
              >
                Get started <span aria-hidden="true">↗</span>
              </Link>
            </>
          )}
          <details className="mobile-nav lg:hidden">
            <summary
              aria-label="Toggle navigation"
              className="flex h-10 w-8 items-center justify-center text-foreground"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </summary>
            <nav
              aria-label="Mobile navigation"
              className="absolute inset-x-0 top-full flex flex-col gap-5 border-b border-border bg-card px-6 py-6"
            >
              {links.map((link) => (
                <Link className="nav-link" href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
              <Link
                className="nav-link"
                href={profile ? `/dashboard/${profile.role}` : "/auth/login"}
              >
                {profile ? "My workspace" : "Sign in"}
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}
