"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import type { ProfileDto, UserRole } from "@workspace/types"

import { signOutAction } from "@/app/auth/actions"
import { cn } from "@workspace/ui/lib/utils"

type DashboardNavItem = {
  href: string
  label: string
}

type DashboardShellProps = {
  children: ReactNode
  profile: ProfileDto
}

const navigationByRole: Record<UserRole, DashboardNavItem[]> = {
  admin: [
    { href: "/dashboard/admin/users", label: "User management" },
    { href: "/dashboard/admin/courses", label: "Course approval" },
    { href: "/dashboard/admin/revenue", label: "Revenue overview" },
    { href: "/dashboard/admin/payments", label: "Pending payments" },
  ],
  instructor: [
    { href: "/dashboard/instructor/courses", label: "My courses" },
    { href: "/dashboard/instructor/courses/new", label: "Course builder" },
    { href: "/dashboard/instructor#students", label: "Students" },
    { href: "/dashboard/instructor#analytics", label: "Analytics" },
    { href: "/dashboard/instructor#payouts", label: "Payout requests" },
  ],
  student: [
    { href: "/dashboard/student", label: "My learning" },
    { href: "/courses", label: "Browse courses" },
    { href: "/dashboard/student#certificates", label: "Certificates" },
    { href: "/dashboard/student#orders", label: "Order/payment status" },
  ],
}

function splitHref(href: string) {
  const [pathname, hash = ""] = href.split("#")

  return { hash: hash ? `#${hash}` : "", pathname }
}

function isActiveNavItem(currentPathname: string, currentHash: string, href: string) {
  const target = splitHref(href)

  if (target.hash) {
    return currentPathname === target.pathname && currentHash === target.hash
  }

  return (
    currentPathname === target.pathname ||
    currentPathname.startsWith(`${target.pathname}/`)
  )
}

function DashboardNavLink({
  currentHash,
  currentPathname,
  href,
  label,
  onNavigate,
}: DashboardNavItem & {
  currentHash: string
  currentPathname: string
  onNavigate?: () => void
}) {
  const active = isActiveNavItem(currentPathname, currentHash, href)

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-between border border-transparent px-4 py-3 text-sm transition-colors",
        active
          ? "border-[#C9A15A] bg-[#1B1F29] text-[#F2EFE7]"
          : "text-[#8B8D98] hover:border-[#2A2F3A] hover:bg-[#171B23] hover:text-[#F2EFE7]",
      )}
      href={href}
      onClick={onNavigate}
    >
      <span>{label}</span>
      {active ? <span className="h-2 w-2 rounded-full bg-[#C9A15A]" /> : null}
    </Link>
  )
}

export function DashboardShell({ children, profile }: DashboardShellProps) {
  const pathname = usePathname()
  const [currentHash, setCurrentHash] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigation = navigationByRole[profile.role]
  const name = profile.fullName?.trim() || profile.email
  const initials = (profile.fullName?.trim()?.[0] ?? profile.email[0] ?? "U").toUpperCase()

  useEffect(() => {
    const updateHash = () => {
      setCurrentHash(window.location.hash)
    }

    updateHash()
    window.addEventListener("hashchange", updateHash)

    return () => {
      window.removeEventListener("hashchange", updateHash)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#12151C] text-[#F2EFE7] lg:flex">
      <button
        aria-label="Close navigation"
        className={cn(
          "fixed inset-0 z-30 bg-black/60 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
        type="button"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-80 border-r border-[#2A2F3A] bg-[#12151C] transition-transform duration-200 lg:static lg:z-auto lg:flex lg:min-h-screen lg:flex-col lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col px-5 py-6">
          <div className="space-y-4">
            <div className="h-px w-24 bg-[#C9A15A]" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#8B8D98]">
                {profile.role} workspace
              </p>
              <h2 className="mt-3 text-2xl font-normal tracking-tight"></h2>
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[#2A2F3A] bg-[#1B1F29]">
                  {profile.avatarUrl ? (
                    <Image
                      alt={name}
                      className="object-cover"
                      fill
                      sizes="48px"
                      src={profile.avatarUrl}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#C9A15A]">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-normal tracking-tight">{name}</h2>
                  <p className="mt-2 text-sm text-[#8B8D98]">{profile.email}</p>
                </div>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            <DashboardNavLink
              currentHash={currentHash}
              currentPathname={pathname}
              href="/dashboard/profile"
              label="Profile settings"
            />
          </nav>

          <nav className="mt-8 space-y-2">
            {navigation.map((item) => (
              <DashboardNavLink
                currentHash={currentHash}
                currentPathname={pathname}
                href={item.href}
                key={item.href}
                label={item.label}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-auto pt-8">
            <div className="border-t border-[#2A2F3A] pt-5">
              <p className="text-sm text-[#8B8D98]">{profile.email}</p>
              <form action={signOutAction} className="mt-4">
                <button
                  className="w-full border border-[#C9A15A] px-4 py-3 text-sm text-[#C9A15A] transition-colors hover:bg-[#1B1F29]"
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#2A2F3A] px-5 py-4 lg:hidden">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#8B8D98]">
              {profile.role} workspace
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-full border border-[#2A2F3A] bg-[#1B1F29]">
                {profile.avatarUrl ? (
                  <Image
                    alt={name}
                    className="object-cover"
                    fill
                    sizes="36px"
                    src={profile.avatarUrl}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[#C9A15A]">
                    {initials}
                  </div>
                )}
              </div>
              <Link
                className="text-sm text-[#F2EFE7]"
                href="/dashboard/profile"
              >
                {name}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="border border-[#2A2F3A] px-3 py-2 text-sm text-[#F2EFE7]"
              href="/dashboard/profile"
            >
              Profile
            </Link>
            <button
              className="border border-[#C9A15A] px-3 py-2 text-sm text-[#C9A15A]"
              onClick={() => setMobileOpen(true)}
              type="button"
            >
              Menu
            </button>
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
