import Link from "next/link"
import { notFound } from "next/navigation"
import type { MessageThreadDetailResponse } from "@/lib/types"

import { ApiClientError, authenticatedApiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/ui/page-header"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"

import { ThreadView } from "../../../messages/thread-view"

export const dynamic = "force-dynamic"

export default async function InstructorMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let detail: MessageThreadDetailResponse | null = null
  let migrationPending = false

  try {
    detail = await authenticatedApiFetch<MessageThreadDetailResponse>(
      `/messages/threads/${id}`,
      { cache: "no-store" }
    )
  } catch (caught) {
    if (caught instanceof ApiClientError && caught.status === 404) {
      notFound()
    }
    if (isMigrationPendingError(caught)) {
      migrationPending = true
    } else {
      throw caught
    }
  }

  if (migrationPending) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="শিক্ষক ড্যাশবোর্ড"
          lede="মেসেজ ফিচারটি চালু করতে ডেটাবেস মাইগ্রেশন প্রয়োজন।"
          title="মেসেজ"
        />
        <MigrationNotice feature="মেসেজ" />
      </div>
    )
  }

  if (!detail) throw new Error("Message thread could not be loaded.")

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
