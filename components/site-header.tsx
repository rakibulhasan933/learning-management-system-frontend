import Link from "next/link"
import Image from "next/image"
import { Menu } from "lucide-react"
import type { ProfileDto } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { getDashboardPath } from "@/lib/auth/dashboard"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"

async function getPublicProfile() {
  try {
    return await authenticatedApiFetch<ProfileDto>("/auth/me", {
      cache: "no-store",
    })
  } catch {
    return null
  }
}

const navItems = [
  { href: "/courses", label: "কোর্স" },
  { href: "/about", label: "আমাদের কথা" },
  { href: "/faq", label: "প্রশ্নোত্তর" },
  { href: "/contact", label: "যোগাযোগ" },
] as const

export async function SiteHeader({ variant = "default" }: { variant?: "default" | "home" }) {
  const profile = await getPublicProfile()
  const initials = (
    profile?.fullName?.trim()?.[0] ??
    profile?.email?.[0] ??
    "L"
  ).toUpperCase()
  const dashboardPath = profile ? getDashboardPath(profile.role) : null

  return (
    <header className={`sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-md ${variant === "home" ? "folio-home-header" : ""}`}>
      <span aria-hidden className="block h-px w-full bg-primary" />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <BrandMark />

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              className="site-header-nav-link interactive-link"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          {profile ? (
            <Link
              className="site-header-nav-link interactive-link"
              href={dashboardPath ?? "/dashboard/student"}
            >
              Dashboard
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="site-header-actions hidden items-center gap-3 md:flex">
            {profile ? (
              <Button asChild variant="outline">
                <Link
                  className="inline-flex items-center gap-2"
                  href={dashboardPath ?? "/dashboard/profile"}
                >
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
                  <span>অ্যাকাউন্ট</span>
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link href="/auth/login">লগইন</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">অ্যাকাউন্ট খুলুন</Link>
                </Button>
              </>
            )}
          </div>

          <details className="relative md:hidden">
            <summary className="list-none">
              <span className="interactive-surface inline-flex size-10 items-center justify-center rounded-xl ring-1 ring-foreground/10">
                <Menu className="size-4" />
                <span className="sr-only">Open menu</span>
              </span>
            </summary>
            <div className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-64 rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
              <nav className="grid gap-1 text-sm">
                {navItems.map((item) => (
                  <Button
                    asChild
                    className="justify-start"
                    key={item.href}
                    variant="ghost"
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
                {profile ? (
                  <Button asChild className="justify-start" variant="ghost">
                    <Link href={dashboardPath ?? "/dashboard/student"}>
                      Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild className="justify-start" variant="ghost">
                      <Link href="/auth/login">লগইন</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/auth/signup">অ্যাকাউন্ট খুলুন</Link>
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
