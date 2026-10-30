import type { InstructorCourseListResponse } from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { SubmitButton } from "@/components/submit-button"
import { Textarea } from "@/components/ui/textarea"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"

import { createBundleAction } from "./actions"

export const dynamic = "force-dynamic"

export default async function InstructorBundlesPage() {
  const data = await authenticatedApiFetch<InstructorCourseListResponse>(
    "/instructor/courses",
    { cache: "no-store" }
  )
  let migrationPending = false
  try {
    await authenticatedApiFetch("/bundles", { cache: "no-store" })
  } catch (error) {
    migrationPending = isMigrationPendingError(error)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ইন্সট্রাক্টর · বান্ডেল"
        lede="শুধুমাত্র আপনার নিজের কোর্স দিয়ে বান্ডেল তৈরি করুন। বান্ডেল কেনার পর শিক্ষার্থীর পেমেন্ট বিদ্যমান PayConfirm প্রমাণ ফ্লোতে যাচাই হবে।"
        title="বান্ডেল তৈরি করুন"
      />
      {migrationPending ? <MigrationNotice feature="বান্ডেল তৈরি" /> : null}
      {data.courses.length === 0 ? (
        <EmptyState
          description="Create a course first, then bundle your own courses together."
          title="এখনও কোনো কোর্স নেই"
        />
      ) : (
        <Card>
          <CardContent>
            <form action={createBundleAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">বান্ডেলের নাম</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="price">মূল্য</Label>
                  <Input
                    id="price"
                    min={0}
                    name="price"
                    required
                    type="number"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">আগের মূল্য (ঐচ্ছিক)</Label>
                  <Input
                    id="originalPrice"
                    min={0}
                    name="originalPrice"
                    type="number"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationDays">মেয়াদ, দিনে (ঐচ্ছিক)</Label>
                  <Input
                    id="durationDays"
                    min={1}
                    name="durationDays"
                    type="number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">মুদ্রা</Label>
                <Input defaultValue="BDT" id="currency" name="currency" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">বিবরণ (ঐচ্ছিক)</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  আপনার কোর্স বাছুন (কমপক্ষে একটি)
                </legend>
                {data.courses.map((course) => (
                  <label
                    className="flex items-center gap-2 text-sm"
                    key={course.id}
                  >
                    <input name="courseIds" type="checkbox" value={course.id} />
                    {course.title}
                  </label>
                ))}
                <p className="text-xs text-muted-foreground">
                  শুধু আপনার নিজের কোর্স দেখানো হচ্ছে; অন্য শিক্ষকের কোর্স
                  বান্ডেলে যোগ করা যাবে না।
                </p>
              </fieldset>
              <SubmitButton>বান্ডেল তৈরি করুন</SubmitButton>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
