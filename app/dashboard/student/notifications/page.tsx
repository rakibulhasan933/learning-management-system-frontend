import type { NotificationListResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/ui/page-header"

import { NotificationList } from "../../notifications/notification-list"

export const dynamic = "force-dynamic"

export default async function StudentNotificationsPage() {
  const response = await authenticatedApiFetch<NotificationListResponse>(
    "/notifications",
    { cache: "no-store" }
  )

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী ড্যাশবোর্ড"
        lede="আপনার কোর্স, অর্ডার ও শেখার অগ্রগতি নিয়ে সব আপডেট এক জায়গায়।"
        title="নোটিফিকেশন"
      />
      <NotificationList
        initialNotifications={response.notifications}
        initialUnreadCount={response.unreadCount}
      />
    </div>
  )
}
