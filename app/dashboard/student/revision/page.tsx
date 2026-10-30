import type {
  BookmarkListResponse,
  FlashcardListResponse,
  MistakeBankResponse,
  NoteListResponse,
  RevisionSummaryResponse,
  RevisionTodayResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
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

const bn = (n: number) => n.toLocaleString("bn-BD")

const panel = "rounded-xl border border-border bg-card"
const h2 = "text-xl font-semibold"
const selectCls =
  "min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
const summaryCls =
  "flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 font-semibold [&::-webkit-details-marker]:hidden"

function recommendationText(
  recommendation: RevisionTodayResponse["weakTopicRecommendations"][number]
) {
  if (typeof recommendation === "string") return recommendation
  return recommendation.topic ?? recommendation.reason ?? "দুর্বল টপিক"
}

function Toggle() {
  return (
    <span aria-hidden className="text-2xl leading-none text-primary">
      <span className="group-open:hidden">+</span>
      <span className="hidden group-open:inline">–</span>
    </span>
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
    else loadError = "আজকের রিভিশন লোড করা যায়নি।"
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

  const stats = [
    ["আজ due ফ্ল্যাশকার্ড", dueCount],
    ["বুকমার্ক", bookmarks.length],
    ["নোট", notes.length],
    ["Mistake Bank-এ ভুল প্রশ্ন", mistakeQuestions.length],
  ] as const

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="শিক্ষার্থী · রিভিশন"
        lede="আজকের due কার্ড, বুকমার্ক, নোট আর Mistake Bank-এর ভুল প্রশ্ন, সব এক জায়গায়।"
        title="আজকের রিভিশন"
      />

      {migrationPending ? <MigrationNotice feature="রিভিশন" /> : null}
      {loadError ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div className="bg-card p-5" key={label}>
            <dd className="order-2 text-3xl font-semibold tabular-nums">
              {bn(value)}
            </dd>
            <dt className="mt-1 text-sm text-muted-foreground">{label}</dt>
          </div>
        ))}
      </dl>

      {summary || (today && today.weakTopicRecommendations.length > 0) ? (
        <section className={`${panel} space-y-3 p-5`}>
          {summary ? (
            <p className="text-sm text-muted-foreground">
              {[
                summary.dueCount != null
                  ? `Due: ${bn(summary.dueCount)}`
                  : null,
                summary.flashcardCount != null
                  ? `ফ্ল্যাশকার্ড: ${bn(summary.flashcardCount)}`
                  : null,
                summary.bookmarkCount != null
                  ? `বুকমার্ক: ${bn(summary.bookmarkCount)}`
                  : null,
                summary.noteCount != null
                  ? `নোট: ${bn(summary.noteCount)}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          {(() => {
            const topics = [
              ...(summary?.weakTopics ?? []),
              ...(today?.weakTopicRecommendations ?? []).map(
                recommendationText
              ),
            ]
            return topics.length > 0 ? (
              <div>
                <h2 className="text-sm font-semibold">দুর্বল টপিক</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {topics.map((topic, index) => (
                    <li
                      className="rounded-full border border-border px-3 py-1 text-sm"
                      key={`${topic}-${index}`}
                    >
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          })()}
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">আজকের কার্ড</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            উত্তর দেখার পর ০ (একদম মনে নেই) থেকে ৫ (সহজে মনে আছে) দিয়ে মান দিন।
            এটি SM-2-ধাঁচের সময়সূচি, FSRS নয়।
          </p>
        </div>
        {reviewQueue.length === 0 ? (
          <p className={`${panel} p-6 text-muted-foreground`}>
            আজ due কোনো ফ্ল্যাশকার্ড নেই।
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {reviewQueue.map((card) => (
              <article
                className={`${panel} space-y-4 p-5 sm:p-6`}
                key={card.id}
              >
                <p className="text-sm text-muted-foreground">
                  {[card.subject, card.chapter, card.topic]
                    .filter(Boolean)
                    .join(" · ")}
                  {(card.dueAt ?? card.nextReviewAt)
                    ? ` · due ${formatDateTime(card.dueAt ?? card.nextReviewAt ?? "")}`
                    : ""}
                </p>
                <p className="text-lg leading-[1.7] font-semibold">
                  {card.front}
                </p>
                <details className="group rounded-lg border border-border">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                    উত্তর দেখুন
                    <Toggle />
                  </summary>
                  <p className="border-t border-border px-4 py-3 text-muted-foreground">
                    {card.back}
                  </p>
                </details>
                <form action={reviewFlashcardAction} className="space-y-3">
                  <input name="flashcardId" type="hidden" value={card.id} />
                  <fieldset>
                    <legend className="text-sm font-medium">
                      মনে রাখার মান
                    </legend>
                    <div className="mt-2 grid grid-cols-6 gap-2">
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <label className="block" key={n}>
                          <input
                            className="peer sr-only"
                            name="quality"
                            required
                            type="radio"
                            value={n}
                          />
                          <span className="flex min-h-12 items-center justify-center rounded-lg border border-border text-lg font-semibold transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary hover:border-primary">
                            {bn(n)}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>০ · একদম মনে নেই</span>
                      <span>৫ · সহজে মনে আছে</span>
                    </div>
                  </fieldset>
                  <SubmitButton>রিভিউ জমা দিন</SubmitButton>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-2">
        <details className={`${panel} group`}>
          <summary className={`${summaryCls} py-4`}>
            নতুন ফ্ল্যাশকার্ড যোগ করুন
            <Toggle />
          </summary>
          <form
            action={createFlashcardAction}
            className="space-y-4 border-t border-border p-5"
          >
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
        </details>

        <div className={`${panel} p-5 sm:p-6`}>
          <h2 className={h2}>বুকমার্ক</h2>
          <form
            action={createBookmarkAction}
            className="mt-4 grid gap-3 sm:grid-cols-[8rem_1fr_auto] sm:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="bm-type">ধরন</Label>
              <select className={selectCls} id="bm-type" name="type" required>
                <option value="question">প্রশ্ন</option>
                <option value="lesson">লেসন</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bm-target">টার্গেট আইডি</Label>
              <Input id="bm-target" name="targetId" required />
            </div>
            <SubmitButton>যোগ করুন</SubmitButton>
          </form>
          <ul className="mt-5 divide-y divide-border border-t border-border">
            {bookmarks.length === 0 ? (
              <li className="pt-4 text-sm text-muted-foreground">
                এখনও কোনো বুকমার্ক নেই।
              </li>
            ) : (
              bookmarks.map((bookmark) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
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
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">নোট</h2>
        <details className={`${panel} group`}>
          <summary className={`${summaryCls} py-4`}>
            নতুন নোট যোগ করুন
            <Toggle />
          </summary>
          <form
            action={createNoteAction}
            className="space-y-4 border-t border-border p-5"
          >
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
        </details>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">এখনও কোনো নোট নেই।</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {notes.map((note) => (
              <article className={`${panel} space-y-3 p-5`} key={note.id}>
                {[note.lessonId, note.questionId].filter(Boolean).length > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {[note.lessonId, note.questionId]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
                <form action={updateNoteAction} className="space-y-2">
                  <input name="noteId" type="hidden" value={note.id} />
                  <Label className="sr-only" htmlFor={`note-edit-${note.id}`}>
                    নোট সম্পাদনা
                  </Label>
                  <Textarea
                    defaultValue={note.body}
                    id={`note-edit-${note.id}`}
                    name="body"
                    required
                    rows={3}
                  />
                  <SubmitButton size="sm" variant="outline">
                    আপডেট করুন
                  </SubmitButton>
                </form>
                <form action={deleteNoteAction}>
                  <input name="noteId" type="hidden" value={note.id} />
                  <SubmitButton size="sm" variant="ghost">
                    নোট মুছুন
                  </SubmitButton>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={`${panel} space-y-4 p-5 sm:p-6`}>
        <div>
          <h2 className={h2}>Mistake Bank-এর ভুল প্রশ্ন</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            এখানে শুধু সেই প্রশ্নগুলোই আছে যেগুলো আপনি আগে চেষ্টা করে ভুল
            করেছেন। চেষ্টা না করা প্রশ্ন এখানে কখনও আসে না।
          </p>
        </div>
        {mistakeQuestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            রিভিশনের জন্য কোনো ভুল প্রশ্ন নেই।
          </p>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {mistakeQuestions.map((question) => (
              <li className="py-4" key={question.id}>
                <p className="text-sm text-muted-foreground">
                  {[question.subject, question.chapter, question.topic]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-1">{question.questionText}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
