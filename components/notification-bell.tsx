"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"

import type { UserRole } from "@/lib/types"
import { cn } from "@/lib/utils"

import { getUnreadNotificationCountAction } from "@/app/dashboard/notifications/actions"

/**
 * Notification bell shown in the dashboard shell header for every role.
 * Reads the unread count through a server action and links to the role's
 * notifications page. Count is refreshed on mount and whenever the window
 * regains focus.
 */
export function NotificationBell({ role }: { role: UserRole }) {
  const [unreadCount, setUnreadCount] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    try {
      setUnreadCount(await getUnreadNotificationCountAction())
    } catch {
      // Keep the last known count (or none) instead of breaking the header.
    }
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener("focus", refresh)

    return () => {
      window.removeEventListener("focus", refresh)
    }
  }, [refresh])

  return (
    <Link
      aria-label="নোটিফিকেশন"
      className={cn(
        "relative inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border",
        "text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
      )}
      href={`/dashboard/${role}/notifications`}
    >
      <Bell className="size-4" />
      {unreadCount !== null && unreadCount > 0 ? (
        <span
          aria-label={`${unreadCount} unread notifications`}
          className="absolute -top-1 -right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground tabular-nums"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  )
}
