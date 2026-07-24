import Link from "next/link"
import { CheckCircle2, PlayCircle, ShieldCheck, Upload } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"

import { SiteHeader } from "@/components/site-header"
import { VerifiedSeal } from "@/components/verified-seal"

const stats = [
  { value: "12,400", label: "Verified enrollments" },
  { value: "340", label: "Active instructors" },
  { value: "98%", label: "Verified within 24h" },
]

const roles = [
  {
    tag: "ROLE / ADMIN",
    title: "Runs the ledger",
    body: "Reviews payment proofs against transactions, approves or flags enrollments, and manages the course catalog.",
  },
  {
    tag: "ROLE / INSTRUCTOR",
    title: "Builds the course",
    body: "Uploads lessons and video, structures modules, and sees which students are actually progressing.",
  },
  {
    tag: "ROLE / STUDENT",
    title: "Learns and tracks",
    body: "Enrolls, pays by bank transfer or mobile payment, and watches secured video once verified.",
  },
]

const steps = [
  {
    code: "FOLIO-01",
    title: "Enroll",
    body: "Student picks a course and starts checkout.",
    icon: CheckCircle2,
  },
  {
    code: "FOLIO-02",
    title: "Submit proof",
    body: "Uploads a bank transfer or mobile-payment receipt.",
    icon: Upload,
  },
  {
    code: "FOLIO-03",
    title: "Admin reviews",
    body: "Staff checks the receipt against the ledger.",
    icon: ShieldCheck,
  },
  {
    code: "FOLIO-04",
    title: "Access granted",
    body: "Course and video unlock the moment it's approved.",
    icon: PlayCircle,
  },
]

export default async function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[1fr_420px] lg:items-center lg:py-28">
        <div>
          <Badge
            variant="outline"
            className="mb-6 rounded-none border-primary/40 font-mono text-xs tracking-wide text-primary"
          >
            PREMIUM LMS · MANUAL VERIFICATION
          </Badge>
          <h1 className="max-w-2xl font-display text-5xl font-light leading-[1.05] tracking-tight md:text-6xl">
            Every enrollment,
            <br />
            <span className="italic text-primary">verified</span> before it
            counts.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
            Folio is a dark-first learning platform built around one idea:
            payments get checked by a person, not assumed by a webhook.
            Admins verify, instructors teach, students learn — all from one
            ledger.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button  size="lg" className="rounded-none">
              <Link href="/auth/signup">Create account</Link>
            </Button>
            <Button
              
              size="lg"
              variant="outline"
              className="rounded-none"
            >
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>

        <div className="relative border border-border bg-card p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <p className="font-mono text-sm text-muted-foreground">
              ORD-482913
            </p>
            <span className="border border-primary/40 px-3 py-1 font-mono text-xs tracking-wide text-primary">
              PENDING
            </span>
          </div>
          <div className="space-y-5 pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Course</p>
              <p className="mt-1 font-display text-xl">
                Advanced web systems
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-5">
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="mt-1 font-mono text-2xl">68%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="mt-1 font-mono text-2xl">BDT 4,500</p>
              </div>
            </div>
          </div>

          <VerifiedSeal className="absolute -right-6 -top-6 h-24 w-24 rotate-[8deg] bg-background" />
        </div>
      </section>

      <Separator className="bg-border" />

      {/* Stats strip */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 divide-y divide-border border border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((s) => (
            <div key={s.label} className="px-8 py-6 text-center sm:text-left">
              <p className="font-mono text-3xl text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles ledger */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-xs tracking-widest text-muted-foreground">
          THREE ROLES, ONE LEDGER
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl tracking-tight md:text-4xl">
          Everyone sees exactly what their role needs.
        </h2>

        <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-3">
          {roles.map((r) => (
            <div key={r.tag} className="bg-background p-8">
              <p className="font-mono text-xs tracking-wide text-secondary">
                {r.tag}
              </p>
              <h3 className="mt-4 font-display text-2xl">{r.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Verification flow */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs tracking-widest text-muted-foreground">
                HOW VERIFICATION WORKS
              </p>
              <h2 className="mt-3 max-w-xl font-display text-3xl tracking-tight md:text-4xl">
                No auto-approvals. A person checks every receipt.
              </h2>
            </div>
            <VerifiedSeal className="hidden h-20 w-20 shrink-0 -rotate-6 md:block" />
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map((step) => (
              <div key={step.code} className="border-t border-primary pt-5">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-muted-foreground">
                    {step.code}
                  </p>
                  <step.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <VerifiedSeal className="mx-auto h-16 w-16 text-primary" />
        <h2 className="mx-auto mt-8 max-w-lg font-display text-3xl tracking-tight md:text-4xl">
          Open your ledger and start teaching.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          Free to set up. Verification is manual by design, so trust builds
          from day one.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button  size="lg" className="rounded-none">
            <Link href="/auth/signup">Create account</Link>
          </Button>
          <Button  size="lg" variant="outline" className="rounded-none">
            <Link href="/courses">Browse courses</Link>
          </Button>
        </div>
      </section>

      <Separator className="bg-border" />

      <footer className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span className="font-mono">© Folio, {new Date().getFullYear()}</span>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/instructors" className="hover:text-foreground">
              For instructors
            </Link>
            <Link href="/legal" className="hover:text-foreground">
              Legal
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}