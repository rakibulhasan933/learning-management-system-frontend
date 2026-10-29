"use client"

import Link from "next/link"
import { Inbox, MessageCircle } from "lucide-react"

import type { MessageThreadDto } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

function formatWhen(iso: string) {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return date.toLocaleString("bn-BD", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function roleLabel(role: string) {
  if (role === "instructor") {
    return "শিক্ষক"
  }

  if (role === "student") {
    return "শিক্ষার্থী"
  }

  return role
}

/**
 * Shared inbox thread list for students and instructors.
 * `basePath` is the role's messages root, e.g. /dashboard/student/messages.
 */
export function ThreadList({
  basePath,
  threads,
}: {
  basePath: string
  threads: MessageThreadDto[]
}) {
  return (
    <Card>
      <CardContent className="divide-y divide-border p-0">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <Inbox className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              এখনো কোনো কথোপকথন নেই। নতুন মেসেজ এলে এখানে দেখা যাবে।
            </p>
          </div>
        ) : (
          threads.map((thread) => (
            <Link
              className={cn(
                "flex items-start justify-between gap-4 p-5 transition-colors",
                thread.unreadCount > 0
                  ? "bg-primary/5 hover:bg-primary/10"
                  : "hover:bg-accent/50"
              )}
              href={`${basePath}/${thread.id}`}
              key={thread.id}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                  <MessageCircle className="size-4 text-muted-foreground" />
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{thread.subject}</span>
                    {thread.unreadCount > 0 ? (
                      <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground tabular-nums">
                        {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {thread.otherPartyName} · {roleLabel(thread.otherPartyRole)}
                    {thread.courseTitle ? ` · ${thread.courseTitle}` : null}
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {thread.lastMessagePreview}
                  </p>
                </div>
              </div>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {formatWhen(thread.lastMessageAt)}
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
