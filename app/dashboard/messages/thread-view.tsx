"use client"

import { useRef, useState } from "react"
import { Send } from "lucide-react"

import type { MessageDto, MessageThreadDto, UserRole } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

import { sendMessageAction } from "./actions"

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

/**
 * Shared thread view for students and instructors: message bubbles plus a
 * reply box. `viewerRole` decides which side of the conversation is "mine".
 */
export function ThreadView({
  initialMessages,
  thread,
  threadPath,
  viewerRole,
}: {
  initialMessages: MessageDto[]
  thread: MessageThreadDto
  threadPath: string
  viewerRole: UserRole
}) {
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = body.trim()
    setError(null)
    setSent(false)

    if (!trimmed) {
      setError("মেসেজ খালি রাখা যাবে না।")
      return
    }

    if (trimmed.length > 2000) {
      setError("মেসেজ সর্বোচ্চ ২০০০ অক্ষরের হতে পারে।")
      return
    }

    setPending(true)
    try {
      const formData = new FormData()
      formData.set("body", trimmed)
      await sendMessageAction(thread.id, threadPath, formData)
      setBody("")
      setSent(true)
      formRef.current?.reset()
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "মেসেজ পাঠানো যায়নি।"
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-5 sm:p-6">
          {initialMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              এখনো কোনো মেসেজ নেই। নিচে লিখে কথোপকথন শুরু করুন।
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {initialMessages.map((message) => {
                const mine = message.senderRole === viewerRole

                return (
                  <div
                    className={cn(
                      "flex flex-col gap-1",
                      mine ? "items-end" : "items-start"
                    )}
                    key={message.id}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 sm:max-w-[70%]",
                        mine
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md border border-border bg-card"
                      )}
                    >
                      {message.body}
                    </div>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {mine ? "আপনি" : message.senderName} ·{" "}
                      {formatWhen(message.createdAt)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <form
        className="space-y-3 rounded-xl border border-border bg-card/40 p-4"
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <label
          className="font-mono text-xs text-muted-foreground"
          htmlFor="message-body"
        >
          উত্তর লিখুন
        </label>
        <Textarea
          disabled={pending}
          id="message-body"
          maxLength={2000}
          onChange={(event) => setBody(event.target.value)}
          placeholder="আপনার মেসেজ লিখুন…"
          rows={3}
          value={body}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {sent ? (
          <p className="text-sm text-muted-foreground" role="status">
            মেসেজ পাঠানো হয়েছে।
          </p>
        ) : null}
        <Button disabled={pending} type="submit">
          <Send className="size-4" />
          {pending ? "পাঠানো হচ্ছে…" : "মেসেজ পাঠান"}
        </Button>
      </form>
    </div>
  )
}
