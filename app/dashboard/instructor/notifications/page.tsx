import Link from "next/link"
import type { NotificationListResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"

export const dynamic = "force-dynamic"

export default async function InstructorNotificationsPage() {
  const response = await authenticatedApiFetch<NotificationListResponse>(
    "/instructor/notifications",
    { cache: "no-store" }
  )
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Instructor dashboard"
        lede={`${response.unreadCount} unread notifications about your courses and students.`}
        title="Notifications"
      />
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {response.notifications.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            response.notifications.map((notification) => (
              <div className="p-5" key={notification.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.body}
                    </p>
                  </div>
                  {notification.href ? (
                    <Link
                      className="text-sm text-primary"
                      href={notification.href}
                    >
                      Open
                    </Link>
                  ) : null}
                </div>
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
