"use client"

import { useState } from "react"

import type { InstalmentScheduleResponse } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/submit-button"

import {
  addOrderBumpAction,
  defineInstalmentsAction,
  payInstalmentAction,
} from "./actions"

const bn = (n: number) =>
  n.toLocaleString("bn-BD", { maximumFractionDigits: 2 })

const btnLine =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
const btnPrimary =
  "inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"

/** Client-side sum validation: 2–12 instalments summing exactly to the order amount. */
export function DefineInstalmentsForm({
  orderId,
  orderAmount,
}: {
  orderId: string
  orderAmount: string | number | null
}) {
  const [rows, setRows] = useState<Array<{ amount: string; dueDate: string }>>([
    { amount: "", dueDate: "" },
    { amount: "", dueDate: "" },
  ])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<InstalmentScheduleResponse | null>(null)
  const [pending, setPending] = useState(false)

  const sum = rows.reduce((total, row) => total + (Number(row.amount) || 0), 0)
  const target = orderAmount !== null ? Number(orderAmount) : null
  const diff = target !== null ? target - sum : null
  const matches = diff !== null && Math.abs(diff) <= 0.01

  function update(
    index: number,
    patch: Partial<{ amount: string; dueDate: string }>
  ) {
    setRows((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item))
    )
  }

  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <div className="grid gap-3 sm:grid-cols-2" key={index}>
          <div className="space-y-1.5">
            <Label htmlFor={`amount-${index}`}>
              কিস্তি {bn(index + 1)}: টাকা
            </Label>
            <Input
              id={`amount-${index}`}
              min={0}
              onChange={(event) =>
                update(index, { amount: event.target.value })
              }
              step="0.01"
              type="number"
              value={row.amount}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`due-${index}`}>শেষ তারিখ</Label>
            <Input
              id={`due-${index}`}
              onChange={(event) =>
                update(index, { dueDate: event.target.value })
              }
              type="datetime-local"
              value={row.dueDate}
            />
          </div>
        </div>
      ))}

      <p
        className={`text-sm ${matches ? "font-medium text-foreground" : "text-muted-foreground"}`}
      >
        যোগফল: {bn(sum)}
        {target !== null ? ` / অর্ডার মোট: ${bn(target)}` : ""}
        {diff !== null
          ? matches
            ? " · মিলেছে"
            : diff > 0
              ? ` · আরও ${bn(diff)} বাকি`
              : ` · ${bn(-diff)} বেশি`
          : ""}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          className={btnLine}
          disabled={rows.length >= 12}
          onClick={() =>
            setRows((current) => [...current, { amount: "", dueDate: "" }])
          }
          type="button"
        >
          কিস্তি যোগ করুন
        </button>
        <button
          className={btnLine}
          disabled={rows.length <= 2}
          onClick={() => setRows((current) => current.slice(0, -1))}
          type="button"
        >
          শেষ কিস্তি বাদ দিন
        </button>
      </div>

      <button
        className={btnPrimary}
        disabled={pending}
        onClick={async () => {
          setError(null)
          setSaved(null)
          if (rows.length < 2 || rows.length > 12) {
            setError("কিস্তি ২ থেকে ১২টির মধ্যে হতে হবে।")
            return
          }
          if (
            rows.some(
              (row) => !(Number(row.amount) > 0) || row.dueDate.trim() === ""
            )
          ) {
            setError("প্রতিটি কিস্তিতে টাকা ও শেষ তারিখ দিন।")
            return
          }
          if (target !== null && Math.abs(sum - target) > 0.01) {
            setError(
              `কিস্তির যোগফল (${bn(sum)}) অর্ডারের মোট (${bn(target)})-এর সমান হতে হবে।`
            )
            return
          }
          setPending(true)
          try {
            setSaved(
              await defineInstalmentsAction(
                orderId,
                rows.map((row) => ({
                  amount: Number(row.amount),
                  dueDate: new Date(row.dueDate).toISOString(),
                }))
              )
            )
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "কিস্তি সংরক্ষণ করা যায়নি।"
            )
          } finally {
            setPending(false)
          }
        }}
        type="button"
      >
        {pending ? "সংরক্ষণ হচ্ছে…" : "কিস্তি সংরক্ষণ করুন"}
      </button>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-foreground" role="status">
          সংরক্ষিত হয়েছে: {bn(saved.instalments.length)}টি কিস্তি।
        </p>
      ) : null}
    </div>
  )
}

export function PayInstalmentForm({
  orderId,
  instalmentId,
}: {
  orderId: string
  instalmentId: string
}) {
  return (
    <form
      action={async (formData) => {
        await payInstalmentAction(formData)
      }}
      className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
    >
      <input name="orderId" type="hidden" value={orderId} />
      <input name="instalmentId" type="hidden" value={instalmentId} />
      <Input
        aria-label="যে নম্বর থেকে পাঠিয়েছেন"
        name="senderNumber"
        placeholder="যে নম্বর থেকে পাঠিয়েছেন"
        required
      />
      <Input
        aria-label="ট্রানজ্যাকশন আইডি (TrxID)"
        name="transactionId"
        placeholder="ট্রানজ্যাকশন আইডি (TrxID)"
        required
      />
      <SubmitButton>PayConfirm দিয়ে যাচাই করুন</SubmitButton>
    </form>
  )
}

export function OrderBumpForm({ orderId }: { orderId: string }) {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <form
        action={async (formData: FormData) => {
          setError(null)
          setMessage(null)
          try {
            const result = await addOrderBumpAction(formData)
            setMessage(
              `যুক্ত হয়েছে: ${result.courseTitle}। নতুন অর্ডার মোট ${result.newOrderAmount}`
            )
          } catch (caught) {
            setError(
              caught instanceof Error ? caught.message : "কোর্স যোগ করা যায়নি।"
            )
          }
        }}
        className="grid gap-2 sm:grid-cols-[1fr_auto]"
      >
        <input name="orderId" type="hidden" value={orderId} />
        <Input
          aria-label="যোগ করতে চাওয়া কোর্সের আইডি"
          name="courseId"
          placeholder="যোগ করতে চাওয়া কোর্সের আইডি"
          required
        />
        <SubmitButton>কোর্স যোগ করুন</SubmitButton>
      </form>
      <p className="text-xs text-muted-foreground">
        শুধুমাত্র আপনার নিজের pending অর্ডারে যোগ করা যায়।
      </p>
      {message ? (
        <p className="text-sm" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
