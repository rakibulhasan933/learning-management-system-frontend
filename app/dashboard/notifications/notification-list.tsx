"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck } from "lucide-react"

import type { NotificationDto } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "./actions"

function formatWhen(iso: string) {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return date.toLocaleString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Shared notification list for the student, instructor, and admin pages.
 * Clicking a notification marks it read and follows its href when present.
 */
export function NotificationList({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: NotificationDto[]
  initialUnreadCount: number
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [markingAll, setMarkingAll] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleOpen(notification: NotificationDto) {
    if (!notification.readAt && markingId !== notification.id) {
      setMarkingId(notification.id)
      setError(null)
      try {
        const readAt = await markNotificationReadAction(notification.id)
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, readAt } : item
          )
        )
        setUnreadCount((current) => Math.max(0, current - 1))
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "পড়া হিসেবে চিহ্নিত করা যায়নি।"
        )
        setMarkingId(null)
        return
      } finally {
        setMarkingId(null)
      }
    }

    if (notification.href) {
      router.push(notification.href)
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true)
    setError(null)
    try {
      await markAllNotificationsReadAction()
      setNotifications((current) =>
        current.map((item) =>
          item.readAt ? item : { ...item, readAt: new Date().toISOString() }
        )
      )
      setUnreadCount(0)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "সব পড়া হিসেবে চিহ্নিত করা যায়নি।"
      )
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0
            ? `${unreadCount}টি অপঠিত নোটিফিকেশন আছে।`
            : "সব নোটিফিকেশন পড়া হয়েছে।"}
        </p>
        <Button
          disabled={markingAll || unreadCount === 0}
          onClick={handleMarkAll}
          size="sm"
          type="button"
          variant="outline"
        >
          <CheckCheck className="size-4" />
          {markingAll ? "চিহ্নিত হচ্ছে…" : "সব পড়া হিসেবে চিহ্নিত করুন"}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <Bell className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                এখনো কোনো নোটিফিকেশন আসেনি।
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const unread = !notification.readAt

              return (
                <button
                  className={cn(
                    "flex w-full items-start justify-between gap-4 p-5 text-left transition-colors",
                    unread
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-accent/50"
                  )}
                  disabled={markingId === notification.id}
                  key={notification.id}
                  onClick={() => handleOpen(notification)}
                  type="button"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium">
                      {unread ? (
                        <span
                          aria-label="অপঠিত"
                          className="size-2 shrink-0 rounded-full bg-primary"
                        />
                      ) : null}
                      <span className="truncate">{notification.title}</span>
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {notification.body}
                    </p>
                    <p className="mt-3 font-mono text-xs text-muted-foreground">
                      {formatWhen(notification.createdAt)}
                    </p>
                  </div>
                  {notification.href ? (
                    <span className="shrink-0 text-sm text-primary">খুলুন</span>
                  ) : null}
                </button>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
