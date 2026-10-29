"use server"

import type {
  NotificationMarkAllReadResponse,
  NotificationMarkReadResponse,
  UnreadCountResponse,
} from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"

/** Read by the notification bell in the dashboard shell header. */
export async function getUnreadNotificationCountAction(): Promise<number> {
  const response = await authenticatedApiFetch<UnreadCountResponse>(
    "/notifications/unread-count",
    { cache: "no-store" }
  )

  return response.unreadCount
}

/** Mark one notification as read. The list UI updates itself optimistically. */
export async function markNotificationReadAction(
  notificationId: string
): Promise<string> {
  const response = await authenticatedApiFetch<NotificationMarkReadResponse>(
    `/notifications/${notificationId}/read`,
    { method: "POST" }
  )

  return response.readAt
}

/** Mark every notification as read. The list UI updates itself optimistically. */
export async function markAllNotificationsReadAction(): Promise<number> {
  const response = await authenticatedApiFetch<NotificationMarkAllReadResponse>(
    "/notifications/read-all",
    { method: "POST" }
  )

  return response.marked
}
