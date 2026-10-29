import Link from "next/link"
import type { MessageThreadListResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"

import { ThreadList } from "../../messages/thread-list"

export const dynamic = "force-dynamic"

export default async function StudentMessagesPage() {
  const response = await authenticatedApiFetch<MessageThreadListResponse>(
    "/messages/threads",
    { cache: "no-store" }
  )

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী ড্যাশবোর্ড"
        lede="আপনার কোর্সের শিক্ষকদের সাথে কথোপকথন।"
        title="মেসেজ"
      />
      <ThreadList
        basePath="/dashboard/student/messages"
        threads={response.threads}
      />
      <p className="text-sm text-muted-foreground">
        কোনো কোর্সের শিক্ষককে সরাসরি মেসেজ করতে চান?{" "}
        <Button asChild size="sm" variant="link">
          <Link href="/courses">কোর্স ব্রাউজ করুন</Link>
        </Button>
      </p>
    </div>
  )
}
