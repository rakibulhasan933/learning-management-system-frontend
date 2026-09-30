import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, LockKeyhole, Workflow } from "lucide-react"

import { PublicShell } from "@/components/public-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressThread } from "@/components/ui/progress-thread"

export const metadata: Metadata = {
  title: "ফোলিও সম্পর্কে",
  description:
    "ফোলিও কীভাবে গুছানো কোর্স, পেমেন্ট যাচাই এবং নিরাপদ শেখাকে একসাথে আনে তা জানুন।",
}

const principles = [
  {
    icon: Workflow,
    title: "গুছানো শেখা",
    body: "Courses move from milestone to module to focused content, so students always know what comes next.",
  },
  {
    icon: CheckCircle2,
    title: "যাচাইকৃত অ্যাক্সেস",
    body: "Payment status is checked before access is activated, and the right course unlocks after confirmation.",
  },
  {
    icon: LockKeyhole,
    title: "নিরাপদ কনটেন্ট ডেলিভারি",
    body: "Signed video URLs, progress tracking and a visible learner watermark protect the learning experience.",
  },
]

export default function AboutPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <ProgressThread className="mb-8 w-24" />
        <p className="font-mono text-xs text-muted-foreground">আমাদের সম্পর্কে · ফোলিও</p>
        <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
          প্রথম ক্লিক থেকেই শেখার অভিজ্ঞতা হোক সহজ ও পরিষ্কার।
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
          ফোলিও এমন একটি লার্নিং প্ল্যাটফর্ম যেখানে মেন্টররা গুছিয়ে কোর্স তৈরি করেন,
          শিক্ষার্থীরা নিজের অগ্রগতি দেখতে পান এবং প্রতিটি এনরোলমেন্টের নির্ভরযোগ্য রেকর্ড থাকে।
        </p>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardContent>
                <Icon className="size-5 text-primary" />
                <h2 className="mt-6 font-heading text-2xl tracking-tight">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-14 grid gap-8 border-t border-border pt-14 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              একটি সংযুক্ত লার্নিং ওয়ার্কস্পেস
            </p>
            <h2 className="mt-3 font-heading text-3xl tracking-tight">
              কোর্সের আউটলাইন থেকে সফল সমাপ্তি পর্যন্ত।
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
              Instructors create milestones, modules, videos, PDFs, quizzes and
              assignments. Students learn through a focused player, see their
              progress and receive access only to the course they purchased.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
            <p className="font-mono text-xs text-primary">Explore Folio</p>
            <div className="mt-5 grid gap-3">
              <Button asChild>
                <Link href="/courses">কোর্স দেখুন</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">সাপোর্টে যোগাযোগ</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
