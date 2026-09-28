import type { Metadata } from "next"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { PublicShell } from "@/components/public-shell"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { ProgressThread } from "@workspace/ui/components/progress-thread"

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Answers about courses, payments, verification and learning on Folio.",
}

const questions = [
  [
    "How does enrollment work?",
    "Choose a published course, create an order and complete the payment instructions. Access is activated only after the payment is successfully verified.",
  ],
  [
    "When do I get course access?",
    "Paid course access is not opened while payment is pending. After successful verification, the order becomes paid, enrollment becomes active and you can continue to the learning page.",
  ],
  [
    "Can I use a coupon?",
    "If a coupon is active, enter it during checkout. The discounted amount is recorded on the order before payment.",
  ],
  [
    "Where are course videos stored?",
    "Videos are delivered through signed, time-limited storage URLs and include a learner email watermark. PDFs and other materials use the configured file storage.",
  ],
  [
    "How can I contact support?",
    "Use the contact page and include your email, course name and order/reference code so the team can investigate quickly.",
  ],
] as const

export default function FaqPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <ProgressThread className="mb-8 w-24" />
        <p className="font-mono text-xs text-muted-foreground">Support · FAQ</p>
        <h1 className="mt-3 font-heading text-4xl tracking-tight sm:text-5xl">
          Answers before you begin.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          A quick guide to verified payments, course access and secure learning.
        </p>
        <div className="mt-12 grid gap-3">
          {questions.map(([question, answer]) => (
            <Card key={question}>
              <CardContent className="p-0">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 font-heading text-xl [&::-webkit-details-marker]:hidden">
                    {question}
                    <ChevronDown className="size-5 shrink-0 text-primary transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="max-w-3xl px-5 pb-5 text-sm leading-7 text-muted-foreground">
                    {answer}
                  </p>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button asChild className="mt-10" variant="outline">
          <Link href="/contact">Still need help? Contact us</Link>
        </Button>
      </section>
    </PublicShell>
  )
}
