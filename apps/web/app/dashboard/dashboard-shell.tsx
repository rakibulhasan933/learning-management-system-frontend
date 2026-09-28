"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  BadgeDollarSign,
  Bell,
  BookOpen,
  ChartColumn,
  Clipboard,
  GraduationCap,
  LibraryBig,
  RotateCcw,
  Settings2,
  Tags,
  Activity,
  Download,
  TicketPercent,
  Megaphone,
  MessageCircle,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  UserRound,
  Users,
} from "lucide-react"
import type { ProfileDto, UserRole } from "@workspace/types"

import { signOutAction } from "@/app/auth/actions"
import { SubmitButton } from "@/components/submit-button"
import { BrandMark } from "@/components/brand-mark"
import { getDashboardPath } from "@/lib/auth/dashboard"
import { cn } from "@workspace/ui/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Button } from "@workspace/ui/components/button"
import { ProgressThread } from "@workspace/ui/components/progress-thread"

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
    {
      href: "/dashboard/admin/courses",
      icon: LibraryBig,
      label: "Course approval",
    },
    { href: "/dashboard/admin/categories", icon: Tags, label: "Categories" },
    {
      href: "/dashboard/admin/enrollments",
      icon: GraduationCap,
      label: "Enrollments",
    },
    { href: "/dashboard/admin/refunds", icon: RotateCcw, label: "Refunds" },
    {
      href: "/dashboard/admin/payouts",
      icon: BadgeDollarSign,
      label: "Instructor payouts",
    },
    {
      href: "/dashboard/admin/revenue",
      icon: ChartColumn,
      label: "Revenue overview",
    },
    {
      href: "/dashboard/admin/announcements",
      icon: Megaphone,
      label: "Announcements",
    },
    {
      href: "/dashboard/admin/audit-logs",
      icon: ScrollText,
      label: "Audit log",
    },
    {
      href: "/dashboard/admin/settings",
      icon: Settings2,
      label: "Site settings",
    },
    {
      href: "/dashboard/admin/coupons",
      icon: TicketPercent,
      label: "Coupon settings",
    },
    {
      href: "/dashboard/admin/health",
      icon: Activity,
      label: "Platform health",
    },
    {
      href: "/dashboard/admin/reports",
      icon: Download,
      label: "Reports export",
    },
  ],
  instructor: [
    { href: "/dashboard/instructor", icon: ChartColumn, label: "Overview" },
    {
      href: "/dashboard/instructor/courses",
      icon: BookOpen,
      label: "My courses",
    },
    {
      href: "/dashboard/instructor/courses/new",
      icon: GraduationCap,
      label: "Course builder",
    },
    { href: "/dashboard/instructor/students", icon: Users, label: "Students" },
    {
      href: "/dashboard/instructor/analytics",
      icon: ChartColumn,
      label: "Analytics",
    },
    {
      href: "/dashboard/instructor/quiz-results",
      icon: Clipboard,
      label: "Quiz results",
    },
    {
      href: "/dashboard/instructor/discussions",
      icon: MessageCircle,
      label: "Discussions",
    },
    {
      href: "/dashboard/instructor/announcements",
      icon: Megaphone,
      label: "Announcements",
    },
    {
      href: "/dashboard/instructor/notifications",
      icon: Bell,
      label: "Notifications",
    },
  ],
  student: [
    { href: "/dashboard/student", icon: BookOpen, label: "Overview" },
    {
      href: "/dashboard/student/classes",
      icon: GraduationCap,
      label: "My classes",
    },
    {
      href: "/dashboard/student/analytics",
      icon: ChartColumn,
      label: "Analytics",
    },
    { href: "/courses", icon: LibraryBig, label: "Browse courses" },
    {
      href: "/dashboard/student/certificates",
      icon: ScrollText,
      label: "Certificates",
    },
    {
      href: "/dashboard/student/orders",
      icon: BadgeDollarSign,
      label: "Order/payment status",
    },
  ],
}

function splitHref(href: string) {
  const [pathname, hash = ""] = href.split("#")

  return { hash: hash ? `#${hash}` : "", pathname }
}

function isActiveNavItem(
  currentPathname: string,
  currentHash: string,
  href: string
) {
  const target = splitHref(href)

  if (target.hash) {
    return currentPathname === target.pathname && currentHash === target.hash
  }

  // A role dashboard is an exact destination. Child pages should not also
  // make the overview item look active.
  if (
    target.pathname &&
    target.pathname.split("/").filter(Boolean).length === 2
  ) {
    return currentPathname === target.pathname
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
        "interactive-surface flex items-center gap-3 rounded-xl border border-transparent text-sm",
        collapsed ? "justify-center px-0 py-3" : "justify-between px-4 py-3",
        active
          ? "border-primary/50 bg-card text-foreground hover:border-primary/70"
          : "text-muted-foreground hover:border-border hover:text-foreground"
      )}
      href={href}
      onClick={onNavigate}
    >
      <Icon className="h-4 w-4 shrink-0 text-inherit" />
      <span className={cn("min-w-0 truncate", collapsed && "hidden")}>
        {label}
      </span>
      {active && !collapsed ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
      ) : null}
    </Link>
  )
}

function SignOutForm({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <form action={signOutAction} className="mt-4">
      <SubmitButton
        aria-label="Sign out"
        className="w-full"
        pendingLabel={collapsed ? "…" : "Signing out..."}
        variant="outline"
      >
        <span className={cn(collapsed && "hidden")}>Sign out</span>
        {collapsed ? <LogOut className="size-4" /> : null}
      </SubmitButton>
    </form>
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
  const initials = (
    profile.fullName?.trim()?.[0] ??
    profile.email[0] ??
    "U"
  ).toUpperCase()

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
      String(sidebarCollapsed)
    )
  }, [sidebarCollapsed])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/92 px-4 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            aria-label="Open navigation"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            size="icon"
            type="button"
            variant="outline"
          >
            <Menu className="size-4" />
          </Button>
          <BrandMark href={getDashboardPath(profile.role)} size="sm" />
          <span className="hidden border-l border-border pl-3 font-mono text-[11px] text-muted-foreground sm:inline">
            {profile.role} workspace
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="truncate text-sm text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {profile.email}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Open account menu"
                className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/50 bg-card text-sm text-primary ring-2 ring-primary/10 transition-colors outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-primary"
                type="button"
              >
                {profile.avatarUrl ? (
                  <Image
                    alt={name}
                    className="object-cover"
                    fill
                    sizes="36px"
                    src={profile.avatarUrl}
                  />
                ) : (
                  initials
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm text-foreground">{name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={getDashboardPath(profile.role)}>
                  <BookOpen className="size-4" />
                  Open dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <UserRound className="size-4" />
                  Profile settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild variant="destructive">
                <form action={signOutAction}>
                  <button
                    className="flex w-full items-center gap-2.5 text-left"
                    type="submit"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 pt-16">
        <aside
          className={cn(
            "fixed top-16 bottom-0 left-0 z-30 hidden shrink-0 flex-col overflow-y-auto border-r border-border bg-background transition-all duration-200 [-ms-overflow-style:none] [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden",
            sidebarCollapsed ? "md:w-24" : "md:w-72"
          )}
        >
          <div
            className={cn(
              "flex min-h-full flex-col py-6 transition-all duration-200",
              sidebarCollapsed ? "px-3" : "px-2 md:px-4 lg:px-5"
            )}
          >
            <div className="space-y-4">
              <ProgressThread
                className={cn(
                  "max-md:mx-auto max-md:w-10",
                  sidebarCollapsed ? "mx-auto w-10" : "w-24"
                )}
              />
              <div className="hidden">
                <div
                  className={cn(
                    "flex items-center gap-3",
                    sidebarCollapsed && "md:flex-col md:gap-3"
                  )}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-primary/40 bg-card ring-2 ring-primary/10">
                    {profile.avatarUrl ? (
                      <Image
                        alt={name}
                        className="object-cover"
                        fill
                        sizes="48px"
                        src={profile.avatarUrl}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-primary/10 font-heading text-sm text-primary">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div
                    className={cn("min-w-0", sidebarCollapsed && "md:hidden")}
                  >
                    <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
                      {profile.role} workspace
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-normal tracking-tight">
                      {name}
                    </h2>
                    <p className="mt-1 text-sm break-words text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  "flex justify-end",
                  sidebarCollapsed && "md:justify-center"
                )}
              >
                <Button
                  aria-label={
                    sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                  }
                  className="max-md:hidden"
                  onClick={() => setSidebarCollapsed((current) => !current)}
                  type="button"
                  variant="outline"
                  size="sm"
                >
                  {sidebarCollapsed ? (
                    <PanelLeftOpen className="size-4" />
                  ) : (
                    <PanelLeftClose className="size-4" />
                  )}
                  <span
                    className={cn(
                      "max-md:hidden",
                      sidebarCollapsed && "md:hidden"
                    )}
                  >
                    {sidebarCollapsed ? "Expand" : "Collapse"}
                  </span>
                </Button>
              </div>
            </div>

            <nav
              className={cn(
                "mt-8 space-y-2",
                sidebarCollapsed && "md:space-y-3"
              )}
            >
              <DashboardNavLink
                currentHash={currentHash}
                currentPathname={pathname}
                href="/dashboard/profile"
                icon={UserRound}
                label="Profile settings"
                collapsed={sidebarCollapsed}
              />
            </nav>

            <nav
              className={cn(
                "mt-8 space-y-2",
                sidebarCollapsed && "md:space-y-3"
              )}
            >
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
              <div className="border-t border-border pt-5">
                <p
                  className={cn(
                    "truncate text-sm text-muted-foreground max-md:hidden",
                    sidebarCollapsed && "md:hidden"
                  )}
                >
                  {profile.email}
                </p>
                <SignOutForm collapsed={sidebarCollapsed} />
              </div>
            </div>
          </div>
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            className="w-[min(88vw,20rem)] border-r border-border bg-background text-foreground"
            side="left"
            showCloseButton
          >
            <SheetHeader className="border-b border-border px-5 py-6">
              <SheetTitle className="text-left font-normal">
                <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
                  {profile.role} workspace
                </span>
                <span className="mt-3 block font-heading text-2xl tracking-tight">
                  {name}
                </span>
              </SheetTitle>
              <p className="text-sm break-words text-muted-foreground">
                {profile.email}
              </p>
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
                <div className="border-t border-border pt-5">
                  <p className="text-sm break-words text-muted-foreground">
                    {profile.email}
                  </p>
                  <SignOutForm />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col overflow-y-auto transition-[margin] duration-200",
            sidebarCollapsed ? "md:ml-24" : "md:ml-72"
          )}
        >
          {/* The shell owns the container and padding so pages can't drift apart. */}
          <div
            className={cn(
              "w-full min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-8",
              profile.role === "admin" ? "max-w-none" : "mx-auto max-w-6xl"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
