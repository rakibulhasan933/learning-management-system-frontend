"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ModelTestEntryForm() {
  const router = useRouter()

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        const testId = new FormData(event.currentTarget).get("testId")
        if (typeof testId === "string" && testId.trim()) {
          router.push(
            `/dashboard/student/model-tests/${encodeURIComponent(testId.trim())}`
          )
        }
      }}
    >
      <div className="flex-1 space-y-2">
        <Label htmlFor="testId">মডেল টেস্ট আইডি</Label>
        <Input id="testId" name="testId" placeholder="টেস্টের UUID" required />
      </div>
      <Button type="submit">টেস্ট খুলুন</Button>
    </form>
  )
}
