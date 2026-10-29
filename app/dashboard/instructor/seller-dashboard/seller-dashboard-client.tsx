"use client"

import { useState } from "react"

import type {
  AnnouncementDraftResponse,
  InstructorCourseDto,
} from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/submit-button"
import { Textarea } from "@/components/ui/textarea"

import {
  createAnnouncementDraftAction,
  exportSellerStudentsAction,
} from "./actions"

export function SellerExportButton() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <div className="space-y-2">
      <Button
        disabled={pending}
        onClick={async () => {
          setPending(true)
          setError(null)
          try {
            const { csv } = await exportSellerStudentsAction()
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = "seller-students.csv"
            link.click()
            URL.revokeObjectURL(url)
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Export could not be downloaded."
            )
          } finally {
            setPending(false)
          }
        }}
        variant="outline"
      >
        {pending ? "ডাউনলোড হচ্ছে…" : "শিক্ষার্থী তালিকা CSV ডাউনলোড করুন"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

export function AnnouncementDraftForm({
  courses,
}: {
  courses: InstructorCourseDto[]
}) {
  const [draft, setDraft] = useState<AnnouncementDraftResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <form
        action={async (formData: FormData) => {
          setError(null)
          try {
            setDraft(await createAnnouncementDraftAction(formData))
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Draft could not be created."
            )
          }
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="draft-course">কোর্স (ফাঁকা রাখলে সব নিজের কোর্স)</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="draft-course"
            name="courseId"
          >
            <option value="">সব কোর্স</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="draft-title">শিরোনাম</Label>
          <Input id="draft-title" name="title" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="draft-body">বার্তা</Label>
          <Textarea id="draft-body" name="body" required rows={4} />
        </div>
        <SubmitButton>খসড়া তৈরি করুন</SubmitButton>
      </form>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {draft ? (
        <div className="rounded-xl border border-border p-4 text-sm">
          <p className="font-medium text-destructive">
            খসড়া মাত্র — কিছু পাঠানো হয়নি, কোনো রেকর্ড তৈরি হয়নি।
          </p>
          <p className="mt-2 font-medium">{draft.draft.title}</p>
          <p className="mt-1 text-muted-foreground">{draft.draft.body}</p>
          <p className="mt-2 text-muted-foreground">
            প্রাপক: {draft.recipientCount} জন (প্রথম ১০ জনের প্রিভিউ নিচে)
          </p>
          <ul className="mt-1 list-disc pl-5 text-muted-foreground">
            {draft.recipientsPreview.map((recipient, index) => (
              <li key={`${recipient.userId ?? index}`}>
                {recipient.fullName ?? "নাম নেই"}
                {recipient.email ? ` · ${recipient.email}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
