import Link from "next/link"
import { notFound } from "next/navigation"
import type { MessageThreadDetailResponse } from "@/lib/types"

import { ApiClientError, authenticatedApiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/ui/page-header"

import { ThreadView } from "../../../messages/thread-view"

export const dynamic = "force-dynamic"

export default async function InstructorMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let detail: MessageThreadDetailResponse

  try {
    detail = await authenticatedApiFetch<MessageThreadDetailResponse>(
      `/messages/threads/${id}`,
      { cache: "no-store" }
    )
  } catch (caught) {
    if (caught instanceof ApiClientError && caught.status === 404) {
      notFound()
    }

    throw caught
  }

  const threadPath = `/dashboard/instructor/messages/${detail.thread.id}`

  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Link
            className="text-sm text-primary underline-offset-4 hover:underline"
            href="/dashboard/instructor/messages"
          >
            সব মেসেজ
          </Link>
        }
        eyebrow={detail.thread.courseTitle || "মেসেজ"}
        lede={`${detail.thread.otherPartyName} · শিক্ষার্থী`}
        title={detail.thread.subject}
      />
      <ThreadView
        initialMessages={detail.messages}
        thread={detail.thread}
        threadPath={threadPath}
        viewerRole="instructor"
      />
    </div>
  )
}
