"use client"

import { useState } from "react"
import { Megaphone } from "lucide-react"

import type { BatchDto, InstructorCourseDto } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { broadcastMessageAction } from "../actions"

type Target = "course" | "batch"

/**
 * Instructor broadcast composer: pick one of their own courses or batches,
 * write a subject and a text body, and message every enrolled student.
 */
export function BroadcastForm({
  batches,
  courses,
}: {
  batches: BatchDto[]
  courses: InstructorCourseDto[]
}) {
  const [target, setTarget] = useState<Target>("course")
  const [courseId, setCourseId] = useState("")
  const [batchId, setBatchId] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<{
    threadsCreated: number
    notified: number
  } | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setResult(null)

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

    if (target === "course" && !courseId) {
      setError("একটি কোর্স বেছে নিন।")
      return
    }

    if (target === "batch" && !batchId) {
      setError("একটি ব্যাচ বেছে নিন।")
      return
    }

    setPending(true)
    try {
      const formData = new FormData()
      formData.set("target", target)
      formData.set("courseId", courseId)
      formData.set("batchId", batchId)
      formData.set("subject", subject.trim())
      formData.set("body", body.trim())
      const response = await broadcastMessageAction(formData)
      setResult({
        notified: response.notified,
        threadsCreated: response.threadsCreated,
      })
      setBody("")
      setSubject("")
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "মেসেজ পাঠানো যায়নি।"
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      className="max-w-2xl space-y-5 rounded-xl border border-border bg-card/40 p-4 sm:p-6"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">কাদের পাঠাবেন</Label>
        <div className="flex gap-2">
          {(
            [
              { label: "কোর্সের শিক্ষার্থী", value: "course" },
              { label: "ব্যাচের শিক্ষার্থী", value: "batch" },
            ] as const
          ).map((option) => (
            <button
              className={cn(
                "rounded-xl border px-4 py-2 text-sm transition-colors",
                target === option.value
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
              disabled={pending}
              key={option.value}
              onClick={() => setTarget(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {target === "course" ? (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">কোর্স</Label>
          <Select
            disabled={pending || courses.length === 0}
            onValueChange={setCourseId}
            value={courseId}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="একটি কোর্স বেছে নিন" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {courses.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              আপনার এখনো কোনো কোর্স নেই।
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">ব্যাচ</Label>
          <Select
            disabled={pending || batches.length === 0}
            onValueChange={setBatchId}
            value={batchId}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="একটি ব্যাচ বেছে নিন" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                  {batch.courseTitle ? ` · ${batch.courseTitle}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {batches.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              আপনার এখনো কোনো ব্যাচ নেই।
            </p>
          ) : null}
        </div>
      )}

      <div className="space-y-1.5">
        <Label
          className="text-sm text-muted-foreground"
          htmlFor="broadcast-subject"
        >
          বিষয় <span className="text-destructive">*</span>
        </Label>
        <Input
          disabled={pending}
          id="broadcast-subject"
          maxLength={120}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="যেমন: আগামীকালের লাইভ ক্লাস"
          value={subject}
        />
      </div>

      <div className="space-y-1.5">
        <Label
          className="text-sm text-muted-foreground"
          htmlFor="broadcast-body"
        >
          মেসেজ <span className="text-destructive">*</span>
        </Label>
        <Textarea
          disabled={pending}
          id="broadcast-body"
          maxLength={2000}
          onChange={(event) => setBody(event.target.value)}
          placeholder="সব শিক্ষার্থীর কাছে যাওয়া বার্তা লিখুন…"
          rows={5}
          value={body}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <p
          className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
          role="status"
        >
          মেসেজ পাঠানো হয়েছে — {result.threadsCreated}টি কথোপকথন তৈরি হয়েছে,
          {result.notified} জনকে নোটিফিকেশন গেছে।
        </p>
      ) : null}

      <Button disabled={pending} type="submit">
        <Megaphone className="size-4" />
        {pending ? "পাঠানো হচ্ছে…" : "সবাইকে পাঠান"}
      </Button>
    </form>
  )
}
