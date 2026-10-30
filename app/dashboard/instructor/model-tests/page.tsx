import Link from "next/link"

import type {
  InstructorCourseListResponse,
  QuestionBankListResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { SubmitButton } from "@/components/submit-button"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"

import { createModelTestAction } from "./actions"

export const dynamic = "force-dynamic"

export default async function InstructorModelTestsPage() {
  const [courses, bank] = await Promise.all([
    authenticatedApiFetch<InstructorCourseListResponse>("/instructor/courses", {
      cache: "no-store",
    }).catch(() => ({
      courses: [] as InstructorCourseListResponse["courses"],
    })),
    authenticatedApiFetch<QuestionBankListResponse>(
      "/instructor/question-bank",
      {
        cache: "no-store",
      }
    ).catch((error: unknown) => {
      if (isMigrationPendingError(error)) return null
      throw error
    }),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ইন্সট্রাক্টর · মডেল টেস্ট"
        lede="পরীক্ষার মতো টেস্ট: টাইমার, প্রশ্ন এলোমেলো করা ও একবারের চেষ্টা ডিফল্ট। কোনো প্রক্টরিং, ওয়েবক্যাম বা ট্যাব নজরদারি নেই।"
        title="মডেল টেস্ট তৈরি করুন"
      />
      {bank === null ? <MigrationNotice feature="মডেল টেস্ট" /> : null}
      {courses.courses.length === 0 ? (
        <EmptyState
          description="Create a course first, then attach a model test to it."
          title="এখনও কোনো কোর্স নেই"
        />
      ) : (
        <Card>
          <CardContent>
            <form action={createModelTestAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">টেস্টের নাম</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseId">কোর্স (শুধু আপনার নিজের কোর্স)</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  id="courseId"
                  name="courseId"
                  required
                >
                  {courses.courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">সময় (মিনিট, ১–৬০০)</Label>
                  <Input
                    id="durationMinutes"
                    max={600}
                    min={1}
                    name="durationMinutes"
                    required
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="negativeMark">
                    নেগেটিভ মার্ক (প্রতি টেস্টে, ডিফল্ট ০)
                  </Label>
                  <Input
                    defaultValue={0}
                    id="negativeMark"
                    max={5}
                    min={0}
                    name="negativeMark"
                    step="0.25"
                    type="number"
                  />
                  <p className="text-xs text-muted-foreground">
                    উদাহরণ মাত্র: BCS-এ −০.৫০, ভর্তি পরীক্ষায় −০.২৫ হতে পারে।
                    এটি কোনো সার্বজনীন ডিফল্ট নয় — প্রতি টেস্টে আলাদা করে
                    নির্ধারণ করুন।
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">
                    সর্বোচ্চ চেষ্টা (ডিফল্ট ১)
                  </Label>
                  <Input
                    defaultValue={1}
                    id="maxAttempts"
                    max={20}
                    min={1}
                    name="maxAttempts"
                    type="number"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    defaultChecked
                    name="shuffleQuestions"
                    type="checkbox"
                  />
                  প্রশ্ন এলোমেলো করুন (ডিফল্ট চালু)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input defaultChecked name="isPublished" type="checkbox" />
                  প্রকাশিত
                </label>
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  প্রশ্নব্যাংক থেকে প্রশ্ন বাছুন
                </legend>
                {!bank || bank.questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    প্রশ্নব্যাংক খালি। প্রথমে প্রশ্নব্যাংকে CSV আমদানি করুন, বা
                    প্রশ্ন ছাড়াই টেস্ট তৈরি করে পরে প্রশ্ন যুক্ত করুন।
                  </p>
                ) : (
                  bank.questions.map((question) => (
                    <label
                      className="flex items-start gap-2 text-sm"
                      key={question.id}
                    >
                      <input
                        className="mt-1"
                        name="questionIds"
                        type="checkbox"
                        value={question.id}
                      />
                      <span>
                        {question.questionText}
                        <span className="text-muted-foreground">
                          {" "}
                          · {question.topic ?? "ট্যাগ ছাড়া"} ·{" "}
                          {question.difficulty}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </fieldset>
              <SubmitButton>মডেল টেস্ট তৈরি করুন</SubmitButton>
            </form>
          </CardContent>
        </Card>
      )}
      <p className="text-sm text-muted-foreground">
        তৈরি করা টেস্টের বিস্তারিত, লিডারবোর্ড ও টপিক রিপোর্ট দেখতে টেস্ট তৈরির
        পরের পাতাটি ব্যবহার করুন।
      </p>
      <Button variant="outline">
        <Link href="/dashboard/instructor/question-bank">
          প্রশ্নব্যাংকে ফিরুন
        </Link>
      </Button>
    </div>
  )
}
