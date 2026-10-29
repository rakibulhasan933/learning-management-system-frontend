"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { createMessageThreadAction } from "./actions"

/** Compose the first message of a new thread with the course instructor. */
export function ComposeMessageForm({
  courseId,
  courseTitle,
}: {
  courseId: string
  courseTitle: string | null
}) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!subject.trim()) {
      setError("বিষয় লিখতে হবে।")
      return
    }

    if (!body.trim()) {
      setError("মেসেজ খালি রাখা যাবে না।")
      return
    }

    if (body.trim().length > 2000) {
      setError("মেসেজ সর্বোচ্চ ২০০০ অক্ষরের হতে পারে।")
      return
    }

    setPending(true)
    try {
      const formData = new FormData()
      formData.set("subject", subject.trim())
      formData.set("body", body.trim())
      await createMessageThreadAction(courseId, formData)
    } catch (caught) {
      // redirect() throws NEXT_REDIRECT; surface only real errors.
      if (
        caught instanceof Error &&
        !caught.message.includes("NEXT_REDIRECT")
      ) {
        setError(caught.message)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-card/40 p-4 sm:p-6"
      onSubmit={handleSubmit}
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="message-subject">
          বিষয় <span className="text-destructive">*</span>
        </label>
        <Input
          disabled={pending}
          id="message-subject"
          maxLength={120}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="যেমন: অ্যাসাইনমেন্ট নিয়ে প্রশ্ন"
          value={subject}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="message-body">
          মেসেজ <span className="text-destructive">*</span>
        </label>
        <Textarea
          disabled={pending}
          id="message-body"
          maxLength={2000}
          onChange={(event) => setBody(event.target.value)}
          placeholder="আপনার প্রশ্ন বা বার্তা লিখুন…"
          rows={5}
          value={body}
        />
        <p className="text-xs text-muted-foreground">
          {courseTitle
            ? `এই মেসেজ "${courseTitle}" কোর্সের শিক্ষকের কাছে যাবে।`
            : "এই মেসেজ কোর্সের শিক্ষকের কাছে যাবে।"}
        </p>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button disabled={pending} type="submit">
        {pending ? "পাঠানো হচ্ছে…" : "মেসেজ পাঠান"}
      </Button>
    </form>
  )
}
