"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  BadgeDollarSign,
  BookOpen,
  ChartColumn,
  GraduationCap,
  LibraryBig,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react"
import type { ProfileDto, UserRole } from "@workspace/types"

import { signOutAction } from "@/app/auth/actions"
import { cn } from "@workspace/ui/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Button } from "@workspace/ui/components/button"

type DashboardNavItem = {
  icon: typeof BookOpen
  href: string
  label: string
}

type DashboardShellProps = {
  children: ReactNode
  profile: ProfileDto
}

const navigationByRole: Record<UserRole, DashboardNavItem[]> = {
  admin: [
    { href: "/dashboard/admin/users", icon: Users, label: "User management" },
    { href: "/dashboard/admin/courses", icon: LibraryBig, label: "Course approval" },
    { href: "/dashboard/admin/revenue", icon: ChartColumn, label: "Revenue overview" },
    { href: "/dashboard/admin/payments", icon: BadgeDollarSign, label: "Pending payments" },
  ],
  instructor: [
    { href: "/dashboard/instructor/courses", icon: BookOpen, label: "My courses" },
    { href: "/dashboard/instructor/courses/new", icon: GraduationCap, label: "Course builder" },
    { href: "/dashboard/instructor#students", icon: Users, label: "Students" },
    { href: "/dashboard/instructor#analytics", icon: ChartColumn, label: "Analytics" },
    { href: "/dashboard/instructor#payouts", icon: WalletCards, label: "Payout requests" },
  ],
  student: [
    { href: "/dashboard/student", icon: BookOpen, label: "My learning" },
    { href: "/courses", icon: LibraryBig, label: "Browse courses" },
    { href: "/dashboard/student#certificates", icon: ScrollText, label: "Certificates" },
    { href: "/dashboard/student#orders", icon: BadgeDollarSign, label: "Order/payment status" },
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
  icon: Icon,
  label,
  collapsed = false,
  onNavigate,
}: DashboardNavItem & {
  currentHash: string
  currentPathname: string
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const active = isActiveNavItem(currentPathname, currentHash, href)

  return (
    <Link
      aria-current={active ? "page" : undefined}
      aria-label={label}
      title={label}
      className={cn(
        "flex items-center gap-3 border border-transparent text-sm transition-colors",
        collapsed ? "justify-center px-0 py-3 lg:rounded-2xl" : "justify-between px-4 py-3",
        active
          ? "border-[#C9A15A] bg-[#1B1F29] text-[#F2EFE7]"
          : "text-[#8B8D98] hover:border-[#2A2F3A] hover:bg-[#171B23] hover:text-[#F2EFE7]",
      )}
      href={href}
      onClick={onNavigate}
    >
      <Icon className="h-4 w-4 shrink-0 text-inherit" />
      <span className={cn("min-w-0 truncate", collapsed && "lg:hidden")}>{label}</span>
      {active ? <span className="h-2 w-2 rounded-full bg-[#C9A15A]" /> : null}
    </Link>
  )
}

export function DashboardShell({ children, profile }: DashboardShellProps) {
  const pathname = usePathname()
  const [currentHash, setCurrentHash] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }

    return window.localStorage.getItem("dashboard-sidebar-collapsed") === "true"
  })
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

  useEffect(() => {
    window.localStorage.setItem(
      "dashboard-sidebar-collapsed",
      String(sidebarCollapsed),
    )
  }, [sidebarCollapsed])

  return (
    <div className="min-h-screen bg-[#12151C] text-[#F2EFE7] lg:flex">
      <aside
        className={cn(
          "hidden min-h-screen border-r border-[#2A2F3A] bg-[#12151C] transition-all duration-200 lg:flex lg:flex-col",
          sidebarCollapsed ? "lg:w-24" : "lg:w-80",
        )}
      >
        <div
          className={cn(
            "flex h-full flex-col py-6 transition-all duration-200",
            sidebarCollapsed ? "px-3" : "px-5",
          )}
        >
          <div className="space-y-4">
            <div className={cn("h-px bg-[#C9A15A]", sidebarCollapsed ? "mx-auto w-10" : "w-24")} />
            <div className={cn("space-y-4", sidebarCollapsed && "lg:space-y-3")}>
              <div className={cn("flex items-center gap-3", sidebarCollapsed && "lg:flex-col lg:gap-3")}>
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#2A2F3A] bg-[#1B1F29]">
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
                <div className={cn("min-w-0", sidebarCollapsed && "lg:hidden")}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#8B8D98]">
                    {profile.role} workspace
                  </p>
                  <h2 className="mt-2 text-2xl font-normal tracking-tight">{name}</h2>
                  <p className="mt-1 break-words text-sm text-[#8B8D98]">
                    {profile.email}
                  </p>
                </div>
              </div>
            </div>
            <div className={cn("flex justify-end", sidebarCollapsed && "lg:justify-center")}>
              <Button
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="border border-[#2A2F3A] bg-transparent text-[#F2EFE7] hover:bg-[#171B23]"
                onClick={() => setSidebarCollapsed((current) => !current)}
                type="button"
                variant="ghost"
                size="sm"
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
                <span className={cn("ml-2", sidebarCollapsed && "lg:hidden")}>
                  {sidebarCollapsed ? "Expand" : "Collapse"}
                </span>
              </Button>
            </div>
          </div>

          <nav className={cn("mt-8 space-y-2", sidebarCollapsed && "lg:space-y-3")}>
            <DashboardNavLink
              currentHash={currentHash}
              currentPathname={pathname}
              href="/dashboard/profile"
              icon={UserRound}
              label="Profile settings"
              collapsed={sidebarCollapsed}
            />
          </nav>

          <nav className={cn("mt-8 space-y-2", sidebarCollapsed && "lg:space-y-3")}>
            {navigation.map((item) => (
              <DashboardNavLink
                currentHash={currentHash}
                currentPathname={pathname}
                href={item.href}
                icon={item.icon}
                key={item.href}
                label={item.label}
                collapsed={sidebarCollapsed}
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

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          className="w-[min(88vw,20rem)] border-r border-[#2A2F3A] bg-[#12151C] text-[#F2EFE7]"
          side="left"
          showCloseButton
        >
          <SheetHeader className="border-b border-[#2A2F3A] px-5 py-6">
            <SheetTitle className="text-left font-normal">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#8B8D98]">
                {profile.role} workspace
              </span>
              <span className="mt-3 block text-2xl tracking-tight">{name}</span>
            </SheetTitle>
            <p className="break-words text-sm text-[#8B8D98]">{profile.email}</p>
          </SheetHeader>

          <div className="flex h-full flex-col px-5 py-6">
            <nav className="space-y-2">
              <DashboardNavLink
                currentHash={currentHash}
                currentPathname={pathname}
                href="/dashboard/profile"
                icon={UserRound}
                label="Profile settings"
                onNavigate={() => setMobileOpen(false)}
              />
              {navigation.map((item) => (
                <DashboardNavLink
                  currentHash={currentHash}
                  currentPathname={pathname}
                  href={item.href}
                  icon={item.icon}
                  key={item.href}
                  label={item.label}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </nav>

            <div className="mt-auto pt-8">
              <div className="border-t border-[#2A2F3A] pt-5">
                <p className="break-words text-sm text-[#8B8D98]">
                  {profile.email}
                </p>
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
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-[#2A2F3A] px-4 py-4 sm:px-5 lg:hidden">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#8B8D98]">
              {profile.role} workspace
            </p>
            <div className="mt-2 flex min-w-0 items-center gap-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#2A2F3A] bg-[#1B1F29]">
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
              <Link className="min-w-0 truncate text-sm text-[#F2EFE7]" href="/dashboard/profile">
                {name}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="hidden border border-[#2A2F3A] px-3 py-2 text-sm text-[#F2EFE7] sm:inline-flex"
              href="/dashboard/profile"
            >
              Profile
            </Link>
            <Button
              className="border border-[#C9A15A] bg-transparent px-3 py-2 text-sm text-[#C9A15A] hover:bg-[#1B1F29]"
              onClick={() => setMobileOpen(true)}
              type="button"
              variant="ghost"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
