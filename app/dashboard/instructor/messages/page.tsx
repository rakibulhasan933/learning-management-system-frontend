import Link from "next/link"
import type { MessageThreadListResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/ui/page-header"

import { ThreadList } from "../../messages/thread-list"

export const dynamic = "force-dynamic"

export default async function InstructorMessagesPage() {
  const response = await authenticatedApiFetch<MessageThreadListResponse>(
    "/messages/threads",
    { cache: "no-store" }
  )

  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Link
            className="text-sm text-primary underline-offset-4 hover:underline"
            href="/dashboard/instructor/messages/broadcast"
          >
            সবাইকে মেসেজ পাঠান
          </Link>
        }
        eyebrow="শিক্ষক ড্যাশবোর্ড"
        lede="শিক্ষার্থীদের সাথে আপনার কথোপকথন।"
        title="মেসেজ"
      />
      <ThreadList
        basePath="/dashboard/instructor/messages"
        threads={response.threads}
      />
    </div>
  )
}
