import type {
  BookmarkListResponse,
  FlashcardListResponse,
  MistakeBankResponse,
  NoteListResponse,
  RevisionSummaryResponse,
  RevisionTodayResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { StatTile } from "@/components/ui/stat-tile"
import { SubmitButton } from "@/components/submit-button"
import { Textarea } from "@/components/ui/textarea"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"
import { formatDateTime } from "@/lib/format"

import {
  createBookmarkAction,
  createFlashcardAction,
  createNoteAction,
  deleteBookmarkAction,
  deleteNoteAction,
  reviewFlashcardAction,
  updateNoteAction,
} from "./actions"

export const dynamic = "force-dynamic"

function recommendationText(
  recommendation: RevisionTodayResponse["weakTopicRecommendations"][number]
) {
  if (typeof recommendation === "string") {
    return recommendation
  }

  return (
    recommendation.topic ??
    recommendation.reason ??
    "দুর্বল টপিক"
  )
}

export default async function StudentRevisionPage() {
  let today: RevisionTodayResponse | null = null
  let dueFlashcards: FlashcardListResponse["flashcards"] = []
  let bookmarks: BookmarkListResponse["bookmarks"] = []
  let notes: NoteListResponse["notes"] = []
  let mistakeQuestions: MistakeBankResponse["questions"] = []
  let summary: RevisionSummaryResponse | null = null
  let migrationPending = false
  let loadError: string | null = null

  try {
    today = await authenticatedApiFetch<RevisionTodayResponse>(
      "/student/revision/today",
      { cache: "no-store" }
    )
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
    else loadError = "Today's revision could not be loaded."
  }

  try {
    const response = await authenticatedApiFetch<FlashcardListResponse>(
      "/student/flashcards?dueOnly=true",
      { cache: "no-store" }
    )
    dueFlashcards = response.flashcards ?? []
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
  }

  try {
    const response = await authenticatedApiFetch<BookmarkListResponse>(
      "/student/bookmarks",
      { cache: "no-store" }
    )
    bookmarks = response.bookmarks ?? []
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
  }

  try {
    const response = await authenticatedApiFetch<NoteListResponse>(
      "/student/notes",
      { cache: "no-store" }
    )
    notes = response.notes ?? []
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
  }

  try {
    const response = await authenticatedApiFetch<MistakeBankResponse>(
      "/student/mistake-bank",
      { cache: "no-store" }
    )
    mistakeQuestions = response.questions ?? []
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
  }

  try {
    summary = await authenticatedApiFetch<RevisionSummaryResponse>(
      "/student/revision",
      { cache: "no-store" }
    )
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
  }

  const reviewQueue =
    today && today.dueFlashcards.length > 0
      ? today.dueFlashcards
      : dueFlashcards
  const dueCount = today?.dueCount ?? reviewQueue.length

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী · রিভিশন"
        lede="আজকের due কিউ, SM-2-ধাঁচের ফ্ল্যাশকার্ড রিভিউ (FSRS নয়), বুকমার্ক, নোট, আর Mistake Bank-এর শুধু ভুল করা প্রশ্ন। চেষ্টা না করা প্রশ্ন এখানে কখনও আসে না।"
        title="আজকের রিভিশন"
      />

      {migrationPending ? (
        <MigrationNotice feature="রিভিশন" />
      ) : null}
      {loadError ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="আজ due ফ্ল্যাশকার্ড" value={String(dueCount)} />
        <StatTile label="বুকমার্ক" value={String(bookmarks.length)} />
        <StatTile label="নোট" value={String(notes.length)} />
        <StatTile
          label="Mistake Bank-এ ভুল প্রশ্ন"
          value={String(mistakeQuestions.length)}
        />
      </div>

      {summary ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            <h2 className="font-heading text-xl text-foreground">
              আমার রিভিশন — সারাংশ
            </h2>
            <p className="mt-2">
              {summary.dueCount !== null && summary.dueCount !== undefined
                ? `Due: ${summary.dueCount} · `
                : ""}
              {summary.flashcardCount !== null &&
              summary.flashcardCount !== undefined
                ? `ফ্ল্যাশকার্ড: ${summary.flashcardCount} · `
                : ""}
              {summary.bookmarkCount !== null &&
              summary.bookmarkCount !== undefined
                ? `বুকমার্ক: ${summary.bookmarkCount} · `
                : ""}
              {summary.noteCount !== null && summary.noteCount !== undefined
                ? `নোট: ${summary.noteCount}`
                : ""}
              {summary.weakTopics && summary.weakTopics.length > 0
                ? ` · দুর্বল টপিক: ${summary.weakTopics.join(", ")}`
                : ""}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {today && today.weakTopicRecommendations.length > 0 ? (
        <Card>
          <CardContent className="space-y-2">
            <h2 className="font-heading text-xl">
              দুর্বল টপিকের সুপারিশ
            </h2>
            {today.weakTopicRecommendations.map((recommendation, index) => (
              <p className="text-sm" key={`${recommendationText(recommendation)}-${index}`}>
                {recommendationText(recommendation)}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-heading text-2xl">আজকের due কিউ — ফ্ল্যাশকার্ড রিভিউ</h2>
        <p className="text-sm text-muted-foreground">
          প্রতিটি কার্ডে মনে রাখার মান ০ (একদম মনে নেই) থেকে ৫ (সহজে মনে
          আছে) দিন। এটি SM-2-ধাঁচের সময়সূচি, FSRS নয়।
        </p>
        {reviewQueue.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            আজ due কোনো ফ্ল্যাশকার্ড নেই।
          </p>
        ) : (
          reviewQueue.map((card) => (
            <Card key={card.id}>
              <CardContent className="space-y-3">
                <p className="font-mono text-xs text-muted-foreground">
                  {[card.subject, card.chapter, card.topic]
                    .filter(Boolean)
                    .join(" · ")}
                  {card.dueAt ?? card.nextReviewAt
                    ? ` · due ${formatDateTime(card.dueAt ?? card.nextReviewAt ?? "")}`
                    : ""}
                </p>
                <p className="font-medium">{card.front}</p>
                <details className="text-sm text-muted-foreground">
                  <summary className="cursor-pointer text-foreground">
                    উত্তর দেখুন
                  </summary>
                  <p className="mt-2">{card.back}</p>
                </details>
                <form
                  action={reviewFlashcardAction}
                  className="flex flex-wrap items-end gap-3"
                >
                  <input name="flashcardId" type="hidden" value={card.id} />
                  <div className="space-y-2">
                    <Label htmlFor={`quality-${card.id}`}>
                      মনে রাখার মান (০–৫)
                    </Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      id={`quality-${card.id}`}
                      name="quality"
                      required
                    >
                      <option value="5">৫ — সহজে মনে আছে</option>
                      <option value="4">৪</option>
                      <option value="3">৩</option>
                      <option value="2">২</option>
                      <option value="1">১</option>
                      <option value="0">০ — একদম মনে নেই</option>
                    </select>
                  </div>
                  <SubmitButton size="sm">রিভিউ জমা দিন</SubmitButton>
                </form>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="font-heading text-xl">নতুন ফ্ল্যাশকার্ড</h2>
            <form action={createFlashcardAction} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fc-front">সামনে (প্রশ্ন)</Label>
                <Textarea id="fc-front" name="front" required rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fc-back">পেছনে (উত্তর)</Label>
                <Textarea id="fc-back" name="back" required rows={3} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="fc-subject">বিষয় (ঐচ্ছিক)</Label>
                  <Input id="fc-subject" name="subject" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fc-chapter">অধ্যায় (ঐচ্ছিক)</Label>
                  <Input id="fc-chapter" name="chapter" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fc-topic">টপিক (ঐচ্ছিক)</Label>
                  <Input id="fc-topic" name="topic" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fc-question">
                  প্রশ্ন ব্যাংক প্রশ্ন আইডি (ঐচ্ছিক)
                </Label>
                <Input id="fc-question" name="questionBankQuestionId" />
              </div>
              <SubmitButton>ফ্ল্যাশকার্ড যোগ করুন</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="font-heading text-xl">বুকমার্ক যোগ করুন</h2>
            <form action={createBookmarkAction} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bm-type">ধরন</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  id="bm-type"
                  name="type"
                  required
                >
                  <option value="question">প্রশ্ন</option>
                  <option value="lesson">লেসন</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bm-target">টার্গেট আইডি</Label>
                <Input id="bm-target" name="targetId" required />
              </div>
              <SubmitButton>বুকমার্ক যোগ করুন</SubmitButton>
            </form>
            <div className="mt-6 space-y-2">
              <h3 className="font-medium">আমার বুকমার্ক</h3>
              {bookmarks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  এখনও কোনো বুকমার্ক নেই।
                </p>
              ) : (
                bookmarks.map((bookmark) => (
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
                    key={bookmark.id}
                  >
                    <span>
                      {bookmark.type === "question" ? "প্রশ্ন" : "লেসন"} ·{" "}
                      {bookmark.title ?? bookmark.targetId}
                    </span>
                    <form action={deleteBookmarkAction}>
                      <input
                        name="bookmarkId"
                        type="hidden"
                        value={bookmark.id}
                      />
                      <SubmitButton size="sm" variant="outline">
                        মুছুন
                      </SubmitButton>
                    </form>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent>
          <h2 className="font-heading text-xl">নোট</h2>
          <form action={createNoteAction} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="note-lesson">লেসন আইডি (ঐচ্ছিক)</Label>
                <Input id="note-lesson" name="lessonId" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-question">প্রশ্ন আইডি (ঐচ্ছিক)</Label>
                <Input id="note-question" name="questionId" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-body">নোট</Label>
              <Textarea id="note-body" name="body" required rows={4} />
            </div>
            <SubmitButton>নোট যোগ করুন</SubmitButton>
          </form>
          <div className="mt-6 space-y-4">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                এখনও কোনো নোট নেই।
              </p>
            ) : (
              notes.map((note) => (
                <div
                  className="space-y-3 rounded-xl border border-border p-4"
                  key={note.id}
                >
                  <p className="text-sm">{note.body}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {[note.lessonId, note.questionId]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <form
                    action={updateNoteAction}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <input name="noteId" type="hidden" value={note.id} />
                    <div className="min-w-52 flex-1 space-y-2">
                      <Label htmlFor={`note-edit-${note.id}`}>
                        নোট সম্পাদনা
                      </Label>
                      <Textarea
                        defaultValue={note.body}
                        id={`note-edit-${note.id}`}
                        name="body"
                        required
                        rows={2}
                      />
                    </div>
                    <SubmitButton size="sm" variant="outline">
                      আপডেট করুন
                    </SubmitButton>
                  </form>
                  <form action={deleteNoteAction}>
                    <input name="noteId" type="hidden" value={note.id} />
                    <SubmitButton size="sm" variant="outline">
                      নোট মুছুন
                    </SubmitButton>
                  </form>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <h2 className="font-heading text-xl">
            আমার রিভিশন — Mistake Bank-এর ভুল প্রশ্ন মাত্র
          </h2>
          <p className="text-sm text-muted-foreground">
            এখানে শুধু সেই প্রশ্নগুলোই আছে যেগুলো আপনি আগে চেষ্টা করে ভুল
            করেছেন। চেষ্টা না করা প্রশ্ন এখানে কখনও আসে না — Mistake Bank-এর
            নিয়ম অপরিবর্তিত।
          </p>
          {mistakeQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              রিভিশনের জন্য কোনো ভুল প্রশ্ন নেই।
            </p>
          ) : (
            mistakeQuestions.map((question) => (
              <div
                className="rounded-xl border border-border p-4"
                key={question.id}
              >
                <p className="font-mono text-xs text-muted-foreground">
                  {[question.subject, question.chapter, question.topic]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-1 text-sm">{question.questionText}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
