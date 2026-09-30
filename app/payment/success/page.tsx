"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CheckCircle2, LayoutDashboard } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>
}) {
  const [course, setCourse] = useState("your course")
  const [seconds, setSeconds] = useState(4)

  useEffect(() => {
    void searchParams.then((params) => {
      if (params.course) setCourse(params.course)
    })

    const queryTimer = setInterval(() => {
      setSeconds((current) => Math.max(current - 1, 0))
    }, 1000)
    const redirectTimer = setTimeout(() => {
      window.location.href = "/dashboard/student"
    }, 4000)

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer)
      if (queryTimer) clearInterval(queryTimer)
    }
  }, [searchParams])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary/15 text-secondary ring-8 ring-secondary/5">
          <CheckCircle2 className="size-9" />
        </div>
        <p className="mt-7 font-mono text-xs uppercase tracking-[0.2em] text-secondary">
          Payment verified
        </p>
        <h1 className="mt-3 font-heading text-3xl tracking-tight">
          Payment successful
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Your payment for <span className="font-medium text-foreground">{course}</span> was verified successfully. Your enrollment is now active.
        </p>
        <div className="mt-7 rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Taking you to your dashboard in <span className="font-mono text-foreground">{seconds}s</span>…
        </div>
        <Button asChild className="mt-5 w-full gap-2">
          <Link href="/dashboard/student">
            <LayoutDashboard className="size-4" />
            Open dashboard now
          </Link>
        </Button>
      </section>
    </main>
  )
}
