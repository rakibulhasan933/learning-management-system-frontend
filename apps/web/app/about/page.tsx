import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, LockKeyhole, Workflow } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { ProgressThread } from "@workspace/ui/components/progress-thread"

export const metadata: Metadata = {
  title: "About Folio",
  description: "Learn how Folio connects structured courses, automatic payment verification and secure learning.",
}

const principles = [
  { icon: Workflow, title: "Structured learning", body: "Courses move from milestone to module to focused content, so students always know what comes next." },
  { icon: CheckCircle2, title: "Verified access", body: "Payment status is checked before access is activated, and the right course unlocks automatically after confirmation." },
  { icon: LockKeyhole, title: "Secure delivery", body: "Signed video URLs, progress tracking and a visible learner watermark protect the learning experience." },
]

export default function AboutPage() {
  return <main className="min-h-screen bg-background text-foreground"><SiteHeader /><section className="mx-auto max-w-6xl px-6 py-14 sm:py-20"><Button asChild className="mb-10" variant="outline"><Link href="/"><ArrowLeft className="size-4" />Home</Link></Button><ProgressThread className="mb-8 w-24" /><p className="font-mono text-xs text-muted-foreground">About · Folio</p><h1 className="mt-3 max-w-3xl font-heading text-5xl leading-[1.05] tracking-tight sm:text-6xl">Learning should feel clear from the first click.</h1><p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">Folio is a learning management platform for instructors who build thoughtfully, students who want visible progress, and teams that need reliable enrollment and payment records.</p><div className="mt-14 grid gap-5 md:grid-cols-3">{principles.map(({ icon: Icon, title, body }) => <Card key={title}><CardContent><Icon className="size-5 text-primary" /><h2 className="mt-6 font-heading text-2xl tracking-tight">{title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p></CardContent></Card>)}</div><div className="mt-14 grid gap-8 border-t border-border pt-14 lg:grid-cols-[1fr_0.8fr]"><div><p className="font-mono text-xs text-muted-foreground">One connected workspace</p><h2 className="mt-3 font-heading text-3xl tracking-tight">From course outline to completion.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">Instructors create milestones, modules, videos, PDFs, quizzes and assignments. Students learn through a focused player, see their progress and receive access only to the course they purchased.</p></div><div className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10"><p className="font-mono text-xs text-primary">Explore Folio</p><div className="mt-5 grid gap-3"><Button asChild><Link href="/courses">Browse courses</Link></Button><Button asChild variant="outline"><Link href="/contact">Contact support</Link></Button></div></div></div></section></main>
}
