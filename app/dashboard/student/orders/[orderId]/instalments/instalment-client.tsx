"use client"

import { useState } from "react"

import type { InstalmentScheduleResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/submit-button"

import {
  addOrderBumpAction,
  defineInstalmentsAction,
  payInstalmentAction,
} from "./actions"

/** Client-side sum validation: 2–12 instalments summing exactly to the order amount. */
export function DefineInstalmentsForm({
  orderId,
  orderAmount,
}: {
  orderId: string
  orderAmount: string | null
}) {
  const [rows, setRows] = useState<Array<{ amount: string; dueDate: string }>>([
    { amount: "", dueDate: "" },
    { amount: "", dueDate: "" },
  ])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<InstalmentScheduleResponse | null>(null)
  const [pending, setPending] = useState(false)

  const sum = rows.reduce(
    (total, row) => total + (Number(row.amount) || 0),
    0
  )
  const target = orderAmount !== null ? Number(orderAmount) : null

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div className="grid gap-2 sm:grid-cols-2" key={index}>
          <div className="space-y-1">
            <Label htmlFor={`amount-${index}`}>কিস্তি {index + 1} — টাকা</Label>
            <Input
              id={`amount-${index}`}
              min={0}
              onChange={(event) =>
                setRows((current) =>
                  current.map((item, i) =>
                    i === index ? { ...item, amount: event.target.value } : item
                  )
                )
              }
              step="0.01"
              type="number"
              value={row.amount}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`due-${index}`}>শেষ তারিখ</Label>
            <Input
              id={`due-${index}`}
              onChange={(event) =>
                setRows((current) =>
                  current.map((item, i) =>
                    i === index ? { ...item, dueDate: event.target.value } : item
                  )
                )
              }
              type="datetime-local"
              value={row.dueDate}
            />
          </div>
        </div>
      ))}
      <p className="text-sm text-muted-foreground">
        মোট: {sum.toFixed(2)}
        {target !== null ? ` / অর্ডার মোট: ${target.toFixed(2)}` : ""}
      </p>
      <div className="flex gap-2">
        <Button
          disabled={rows.length >= 12}
          onClick={() =>
            setRows((current) => [...current, { amount: "", dueDate: "" }])
          }
          type="button"
          variant="outline"
        >
          কিস্তি যোগ করুন
        </Button>
        <Button
          disabled={rows.length <= 2}
          onClick={() => setRows((current) => current.slice(0, -1))}
          type="button"
          variant="outline"
        >
          শেষ কিস্তি বাদ দিন
        </Button>
      </div>
      <Button
        disabled={pending}
        onClick={async () => {
          setError(null)
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
              `কিস্তির যোগফল (${sum.toFixed(2)}) অর্ডারের মোট (${target.toFixed(2)})-এর সমান হতে হবে।`
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
                : "Instalments could not be saved."
            )
          } finally {
            setPending(false)
          }
        }}
        type="button"
      >
        {pending ? "সংরক্ষণ হচ্ছে…" : "কিস্তি সংরক্ষণ করুন"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? (
        <p className="text-sm text-muted-foreground">
          সংরক্ষিত হয়েছে: {saved.instalments.length}টি কিস্তি।
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
    <form action={payInstalmentAction} className="mt-2 flex flex-wrap gap-2">
      <input name="orderId" type="hidden" value={orderId} />
      <input name="instalmentId" type="hidden" value={instalmentId} />
      <Input
        aria-label="Sender number"
        name="senderNumber"
        placeholder="Sender number"
        required
      />
      <Input
        aria-label="Transaction ID"
        name="transactionId"
        placeholder="Transaction ID"
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
              `যুক্ত হয়েছে: ${result.courseTitle} — নতুন অর্ডার মোট ${result.newOrderAmount}`
            )
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Order bump could not be added."
            )
          }
        }}
        className="flex flex-wrap gap-2"
      >
        <input name="orderId" type="hidden" value={orderId} />
        <Input
          aria-label="Course ID to add"
          name="courseId"
          placeholder="যোগ করতে চাওয়া কোর্সের আইডি"
          required
        />
        <SubmitButton>অর্ডারে কোর্স যোগ করুন</SubmitButton>
      </form>
      <p className="text-xs text-muted-foreground">
        শুধুমাত্র আপনার নিজের pending অর্ডারে যোগ করা যায়।
      </p>
      {message ? <p className="text-sm">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
