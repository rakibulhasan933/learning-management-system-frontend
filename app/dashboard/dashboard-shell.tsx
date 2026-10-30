"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Activity,
  BadgeDollarSign,
  Bell,
  BookOpen,
  ChartColumn,
  Clipboard,
  Download,
  GraduationCap,
  Landmark,
  Link2,
  LibraryBig,
  LogOut,
  Megaphone,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  ScrollText,
  Settings2,
  Tags,
  TicketPercent,
  UserRound,
  Users,
  Video,
} from "lucide-react"
import type { ProfileDto, UserRole } from "@/lib/types"

import { signOutAction } from "@/app/auth/actions"
import { SubmitButton } from "@/components/submit-button"
import { BrandMark } from "@/components/brand-mark"
import { NotificationBell } from "@/components/notification-bell"
import { getDashboardPath } from "@/lib/auth/dashboard"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

type DashboardNavItem = {
  icon: typeof BookOpen
  href: string
  label: string
}

type DashboardNavGroup = { title: string; items: DashboardNavItem[] }

type DashboardShellProps = {
  children: ReactNode
  profile: ProfileDto
}

const item = (
  href: string,
  icon: DashboardNavItem["icon"],
  label: string
): DashboardNavItem => ({ href, icon, label })

// Items are grouped by the job they do, so long role menus stay scannable.
const navigationByRole: Record<UserRole, DashboardNavGroup[]> = {
  admin: [
    {
      title: "People & content",
      items: [
        item("/dashboard/admin/users", Users, "User management"),
        item("/dashboard/admin/courses", LibraryBig, "Course approval"),
        item("/dashboard/admin/categories", Tags, "Categories"),
        item("/dashboard/admin/enrollments", GraduationCap, "Enrollments"),
      ],
    },
    {
      title: "Money",
      items: [
        item("/dashboard/admin/revenue", ChartColumn, "Revenue overview"),
        item("/dashboard/admin/refunds", RotateCcw, "Refunds"),
        item("/dashboard/admin/payouts", BadgeDollarSign, "Instructor payouts"),
        item(
          "/dashboard/admin/affiliate-payouts",
          BadgeDollarSign,
          "Affiliate payouts"
        ),
        item("/dashboard/admin/coupons", TicketPercent, "Coupon settings"),
      ],
    },
    {
      title: "Insight",
      items: [
        item("/dashboard/admin/analytics", ChartColumn, "Analytics"),
        item("/dashboard/admin/reports", Download, "Reports export"),
        item("/dashboard/admin/health", Activity, "Platform health"),
        item("/dashboard/admin/audit-logs", ScrollText, "Audit log"),
      ],
    },
    {
      title: "Platform",
      items: [
        item("/dashboard/admin/announcements", Megaphone, "Announcements"),
        item("/dashboard/admin/notifications", Bell, "Notifications"),
        item("/dashboard/admin/settings", Settings2, "Site settings"),
      ],
    },
  ],
  instructor: [
    {
      title: "Teach",
      items: [
        item("/dashboard/instructor", ChartColumn, "Overview"),
        item("/dashboard/instructor/courses", BookOpen, "My courses"),
        item(
          "/dashboard/instructor/courses/new",
          GraduationCap,
          "Course builder"
        ),
        item("/dashboard/instructor/question-bank", Clipboard, "Question bank"),
        item("/dashboard/instructor/model-tests", GraduationCap, "Model tests"),
        item("/dashboard/instructor/live-classes", Video, "Live classes"),
        item("/dashboard/instructor/batches", Users, "Batches"),
      ],
    },
    {
      title: "Students",
      items: [
        item("/dashboard/instructor/students", Users, "Students"),
        item("/dashboard/instructor/quiz-results", Clipboard, "Quiz results"),
        item("/dashboard/instructor/discussions", MessageCircle, "Discussions"),
        item("/dashboard/instructor/messages", MessageCircle, "Messages"),
        item("/dashboard/instructor/announcements", Megaphone, "Announcements"),
        item("/dashboard/instructor/notifications", Bell, "Notifications"),
      ],
    },
    {
      title: "Sales",
      items: [
        item(
          "/dashboard/instructor/seller-dashboard",
          BadgeDollarSign,
          "Seller dashboard"
        ),
        item("/dashboard/instructor/analytics", ChartColumn, "Analytics"),
        item("/dashboard/instructor/bundles", LibraryBig, "Bundles"),
        item("/dashboard/instructor/affiliates", BadgeDollarSign, "Affiliates"),
        item(
          "/dashboard/instructor/abandoned-carts",
          Download,
          "Abandoned carts"
        ),
        item("/dashboard/instructor/payouts", Landmark, "Payouts"),
        item(
          "/dashboard/instructor/refund-requests",
          RotateCcw,
          "Refund requests"
        ),
      ],
    },
  ],
  student: [
    {
      title: "শেখা",
      items: [
        item("/dashboard/student", BookOpen, "ওভারভিউ"),
        item("/dashboard/student/classes", GraduationCap, "আমার ক্লাস"),
        item("/dashboard/student/live-classes", Video, "লাইভ ক্লাস"),
        item("/dashboard/student/batches", Users, "ব্যাচ"),
        item("/courses", LibraryBig, "কোর্স দেখুন"),
      ],
    },
    {
      title: "অনুশীলন",
      items: [
        item("/dashboard/student/model-tests", GraduationCap, "মডেল টেস্ট"),
        item("/dashboard/student/mistake-bank", BookOpen, "ভুলের খাতা"),
        item("/dashboard/student/revision", BookOpen, "রিভিশন"),
        item("/dashboard/student/analytics", ChartColumn, "বিশ্লেষণ"),
      ],
    },
    {
      title: "অ্যাকাউন্ট",
      items: [
        item("/dashboard/student/orders", BadgeDollarSign, "অর্ডার ও পেমেন্ট"),
        item("/dashboard/student/certificates", ScrollText, "সার্টিফিকেট"),
        item("/dashboard/student/referrals", Link2, "রেফারেল"),
        item("/dashboard/student/notifications", Bell, "নোটিফিকেশন"),
        item("/dashboard/student/messages", MessageCircle, "বার্তা"),
      ],
    },
  ],
}

const dashboardCopyByRole: Record<
  UserRole,
  {
    workspace: string
    profile: string
    openDashboard: string
    signOut: string
    signingOut: string
    openNavigation: string
    openSidebarMenu: string
    openAccountMenu: string
    expand: string
    collapse: string
  }
> = {
  admin: {
    workspace: "Admin workspace",
    profile: "Profile settings",
    openDashboard: "Open dashboard",
    signOut: "Sign out",
    signingOut: "Signing out...",
    openNavigation: "Open navigation",
    openSidebarMenu: "Open sidebar menu",
    openAccountMenu: "Open account menu",
    expand: "Expand",
    collapse: "Collapse",
  },
  instructor: {
    workspace: "Instructor workspace",
    profile: "Profile settings",
    openDashboard: "Open dashboard",
    signOut: "Sign out",
    signingOut: "Signing out...",
    openNavigation: "Open navigation",
    openSidebarMenu: "Open sidebar menu",
    openAccountMenu: "Open account menu",
    expand: "Expand",
    collapse: "Collapse",
  },
  student: {
    workspace: "শিক্ষার্থী ড্যাশবোর্ড",
    profile: "প্রোফাইল সেটিংস",
    openDashboard: "ড্যাশবোর্ড খুলুন",
    signOut: "সাইন আউট",
    signingOut: "সাইন আউট হচ্ছে...",
    openNavigation: "নেভিগেশন খুলুন",
    openSidebarMenu: "সাইডবার মেনু খুলুন",
    openAccountMenu: "অ্যাকাউন্ট মেনু খুলুন",
    expand: "বড় করুন",
    collapse: "ছোট করুন",
  },
}

type Copy = (typeof dashboardCopyByRole)[UserRole]

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
      className={cn(
        "flex items-center gap-3 rounded-lg py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? "bg-foreground/10 font-medium text-foreground"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      )}
      href={href}
      onClick={onNavigate}
      title={label}
    >
      <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
      <span className={cn("min-w-0 truncate", collapsed && "hidden")}>
        {label}
      </span>
    </Link>
  )
}

function SignOutForm({
  collapsed = false,
  copy,
}: {
  collapsed?: boolean
  copy: Copy
}) {
  return (
    <form action={signOutAction}>
      <SubmitButton
        aria-label={copy.signOut}
        className="w-full"
        pendingLabel={collapsed ? "…" : copy.signingOut}
        variant="outline"
      >
        <span className={cn(collapsed && "hidden")}>{copy.signOut}</span>
        {collapsed ? <LogOut className="size-4" /> : null}
      </SubmitButton>
    </form>
  )
}

/** One sidebar body, used by both the desktop rail and the mobile sheet. */
function SidebarBody({
  collapsed = false,
  copy,
  currentHash,
  groups,
  onNavigate,
  pathname,
}: {
  collapsed?: boolean
  copy: Copy
  currentHash: string
  groups: DashboardNavGroup[]
  onNavigate?: () => void
  pathname: string
}) {
  const link = (navItem: DashboardNavItem) => (
    <DashboardNavLink
      collapsed={collapsed}
      currentHash={currentHash}
      currentPathname={pathname}
      key={navItem.href}
      onNavigate={onNavigate}
      {...navItem}
    />
  )

  return (
    <div className="flex min-h-full flex-col">
      <nav aria-label={copy.workspace} className="flex-1">
        {groups.map((group, index) => (
          <div
            className={cn(
              "flex flex-col gap-0.5",
              index > 0 && "mt-5",
              collapsed && index > 0 && "mt-3 border-t border-border pt-3"
            )}
            key={group.title}
          >
            <p
              className={cn(
                "px-3 pb-1 text-xs text-muted-foreground",
                collapsed && "hidden"
              )}
            >
              {group.title}
            </p>
            {group.items.map(link)}
          </div>
        ))}
      </nav>

      <div className="mt-8 flex flex-col gap-3 border-t border-border pt-4">
        {link(item("/dashboard/profile", UserRound, copy.profile))}
        <SignOutForm collapsed={collapsed} copy={copy} />
      </div>
    </div>
  )
}

export function DashboardShell({ children, profile }: DashboardShellProps) {
  const pathname = usePathname()
  const [currentHash, setCurrentHash] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const groups = navigationByRole[profile.role]
  const copy = dashboardCopyByRole[profile.role]
  const name = profile.fullName?.trim() || profile.email
  const initials = (
    profile.fullName?.trim()?.[0] ??
    profile.email[0] ??
    "U"
  ).toUpperCase()

  useEffect(() => {
    const updateHash = () => setCurrentHash(window.location.hash)
    updateHash()
    window.addEventListener("hashchange", updateHash)
    return () => window.removeEventListener("hashchange", updateHash)
  }, [])

  // Read the saved choice after mount so server and client markup match.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarCollapsed(
      window.localStorage.getItem("dashboard-sidebar-collapsed") === "true"
    )
  }, [])

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      window.localStorage.setItem(
        "dashboard-sidebar-collapsed",
        String(!current)
      )
      return !current
    })
  }

  return (
    <div className="dashboard-shell flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            aria-label={copy.openNavigation}
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            size="icon"
            type="button"
            variant="outline"
          >
            <Menu className="size-4" />
            <span className="sr-only">{copy.openSidebarMenu}</span>
          </Button>
          <BrandMark className="text-xl" />
          <span className="hidden border-l border-border pl-3 text-sm text-muted-foreground sm:inline">
            {copy.workspace}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <NotificationBell role={profile.role} />
          <div className="hidden text-right sm:block">
            <p className="truncate text-sm text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {profile.email}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  aria-label={copy.openAccountMenu}
                  className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-sm font-medium text-primary transition-colors outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-primary"
                  type="button"
                />
              }
            >
              {profile.avatarUrl ? (
                <Image
                  alt={name}
                  className="object-cover"
                  fill
                  sizes="40px"
                  src={profile.avatarUrl}
                />
              ) : (
                initials
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm text-foreground">{name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href={getDashboardPath(profile.role)}>
                  <BookOpen className="size-4" />
                  {copy.openDashboard}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard/profile">
                  <UserRound className="size-4" />
                  {copy.profile}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <form action={signOutAction}>
                  <button
                    className="flex w-full items-center gap-2.5 text-left"
                    type="submit"
                  >
                    <LogOut className="size-4" />
                    {copy.signOut}
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
            "fixed top-16 bottom-0 left-0 z-30 hidden shrink-0 flex-col overflow-y-auto border-r border-border bg-background transition-[width] duration-200 [-ms-overflow-style:none] [scrollbar-width:none] md:!flex [&::-webkit-scrollbar]:hidden",
            sidebarCollapsed ? "md:w-20" : "md:w-64"
          )}
        >
          <div
            className={cn(
              "flex flex-1 flex-col py-4",
              sidebarCollapsed ? "px-3" : "px-4"
            )}
          >
            <div
              className={cn(
                "mb-4 flex",
                sidebarCollapsed ? "justify-center" : "justify-end"
              )}
            >
              <Button
                aria-label={sidebarCollapsed ? copy.expand : copy.collapse}
                onClick={toggleSidebar}
                size={sidebarCollapsed ? "icon" : "sm"}
                type="button"
                variant="ghost"
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="size-4" />
                ) : (
                  <>
                    <PanelLeftClose className="size-4" />
                    {copy.collapse}
                  </>
                )}
              </Button>
            </div>
            <SidebarBody
              collapsed={sidebarCollapsed}
              copy={copy}
              currentHash={currentHash}
              groups={groups}
              pathname={pathname}
            />
          </div>
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            className="w-[min(88vw,20rem)] border-r border-border bg-background text-foreground"
            showCloseButton
            side="left"
          >
            <SheetHeader className="border-b border-border px-5 py-5">
              <SheetTitle className="text-left font-normal">
                <span className="text-sm text-muted-foreground">
                  {copy.workspace}
                </span>
                <span className="mt-1 block text-xl font-semibold">{name}</span>
              </SheetTitle>
              <p className="text-sm break-words text-muted-foreground">
                {profile.email}
              </p>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <SidebarBody
                copy={copy}
                currentHash={currentHash}
                groups={groups}
                onNavigate={() => setMobileOpen(false)}
                pathname={pathname}
              />
            </div>
          </SheetContent>
        </Sheet>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col overflow-y-auto transition-[margin] duration-200",
            sidebarCollapsed ? "md:ml-20" : "md:ml-64"
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
