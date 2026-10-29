import type { NotificationListResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/ui/page-header"

import { NotificationList } from "../notifications/notification-list"

export const dynamic = "force-dynamic"

export default async function AdminNotificationsPage() {
  const response = await authenticatedApiFetch<NotificationListResponse>(
    "/notifications",
    { cache: "no-store" }
  )

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="অ্যাডমিন ড্যাশবোর্ড"
        lede="পেমেন্ট, রিফান্ড, কোর্স অনুমোদন ও প্ল্যাটফর্মের সব গুরুত্বপূর্ণ আপডেট।"
        title="নোটিফিকেশন"
      />
      <NotificationList
        initialNotifications={response.notifications}
        initialUnreadCount={response.unreadCount}
      />
    </div>
  )
}
