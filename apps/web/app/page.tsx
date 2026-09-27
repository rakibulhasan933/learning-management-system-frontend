import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, PlayCircle, ShieldCheck, Upload } from "lucide-react"
import type { CourseListResponse, ProfileDto } from "@workspace/types"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { ProgressThread } from "@workspace/ui/components/progress-thread"
import { Separator } from "@workspace/ui/components/separator"

import { SiteHeader } from "@/components/site-header"
import { authenticatedApiFetch, publicApiFetch } from "@/lib/api-client"
import { getDashboardPath } from "@/lib/auth/dashboard"
import { VerifiedSeal } from "@/components/verified-seal"

const stats = [
  { value: "12,400", label: "Verified enrollments" },
  { value: "340", label: "Active instructors" },
  { value: "98%", label: "Verified within 24h" },
]

const roles = [
  {
    tag: "Role / admin",
    title: "Runs the ledger",
    body: "Monitors payment outcomes, manages access and keeps the course catalog healthy.",
  },
  {
    tag: "Role / instructor",
    title: "Builds the course",
    body: "Uploads lessons and video, structures modules, and sees which students are actually progressing.",
  },
  {
    tag: "Role / student",
    title: "Learns and tracks",
    body: "Enrolls, pays by bank transfer or mobile payment, and watches secured video once verified.",
  },
]

const steps = [
  {
    code: "Folio-01",
    title: "Choose a course",
    body: "Find a structured course and start checkout.",
    icon: CheckCircle2,
  },
  {
    code: "Folio-02",
    title: "Apply a coupon",
    body: "Add an active coupon and see the final payable amount.",
    icon: Upload,
  },
  {
    code: "Folio-03",
    title: "Pay securely",
    body: "Send the exact amount through the available payment method.",
    icon: ShieldCheck,
  },
  {
    code: "Folio-04",
    title: "Access opens",
    body: "Pay-Confirm verifies the transaction and unlocks your course automatically.",
    icon: PlayCircle,
  },
]

export default async function Page() {
  let profile: ProfileDto | null = null
  try {
    profile = await authenticatedApiFetch<ProfileDto>("/auth/me", { cache: "no-store" })
  } catch {
    // Anonymous visitors see the public CTA.
  }
  let featuredCourses: CourseListResponse["courses"] = []
  try {
    const response = await publicApiFetch<CourseListResponse>(
      "/courses?page=1&pageSize=3",
      { next: { revalidate: 300 } },
    )
    featuredCourses = response.courses
  } catch {
    // The marketing page remains useful when the catalog API is unavailable.
  }
  const dashboardPath = profile ? getDashboardPath(profile.role) : "/auth/signup"

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            description: "Verified online learning with structured courses and secure video.",
            name: "Folio",
            url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://folio.example.com",
          }),
        }}
        type="application/ld+json"
      />
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[1fr_420px] lg:items-center lg:py-28">
        <div>
          <Badge
            variant="outline"
            className="mb-6 border-primary/40 font-mono text-xs tracking-wide text-primary"
          >
            Premium LMS · automatic verification
          </Badge>
          <h1 className="max-w-2xl font-heading text-5xl font-light leading-[1.05] tracking-tight md:text-6xl">
            Every enrollment,
            <br />
            <span className="italic text-primary">verified</span> before it
            counts.
          </h1>
          <ProgressThread className="mt-8 w-24" />
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
            Folio is a dark-first learning platform built around structured
            courses, automatic payment verification and secure learning.
            Instructors teach, students learn, and every enrollment is tracked
            in one clear workspace.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={dashboardPath}>{profile ? "Go to dashboard" : "Create account"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>

        <div className="relative rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <p className="font-mono text-sm text-muted-foreground">
              ORD-482913
            </p>
            <Badge
              variant="outline"
              className="border-primary/40 font-mono text-xs tracking-wide text-primary"
            >
              Pending
            </Badge>
          </div>
          <div className="space-y-5 pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Course</p>
              <p className="mt-1 font-heading text-xl">
                Advanced web systems
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-5">
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="mt-1 font-mono text-2xl">68%</p>
                <ProgressThread className="mt-2 w-full" value={68} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="mt-1 font-mono text-2xl">BDT 4,500</p>
              </div>
            </div>
          </div>

          <VerifiedSeal className="absolute -right-6 -top-6 size-24 rotate-[8deg] rounded-full bg-background" />
        </div>
      </section>

      <Separator className="bg-border" />

      {/* Stats strip */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <dl className="grid gap-5 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="text-center sm:text-left">
                <dd className="font-mono text-3xl text-primary tabular-nums">
                  {s.value}
                </dd>
                <dt className="mt-1 text-sm text-muted-foreground">
                  {s.label}
                </dt>
              </CardContent>
            </Card>
          ))}
        </dl>
      </section>

      {/* Roles ledger */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-xs tracking-wide text-muted-foreground">
          Three roles, one ledger
        </p>
        <h2 className="mt-3 max-w-xl font-heading text-3xl tracking-tight md:text-4xl">
          Everyone sees exactly what their role needs.
        </h2>
        <ProgressThread className="mt-6 w-16" />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {roles.map((r) => (
            <Card className="group" key={r.tag}>
              <CardContent>
                <p className="font-mono text-xs tracking-wide text-secondary">
                  {r.tag}
                </p>
                <h3 className="mt-4 font-heading text-2xl tracking-tight">
                  {r.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {r.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-col items-start justify-between gap-5 text-left sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs tracking-wide text-muted-foreground">
                Featured courses
              </p>
              <h2 className="mt-3 font-heading text-3xl tracking-tight md:text-4xl">
                Start with something worth finishing.
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/courses">View all courses</Link>
            </Button>
          </div>

          {featuredCourses.length > 0 ? (
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {featuredCourses.map((course) => (
                <Link className="group" href={`/courses/${course.slug}`} key={course.id}>
                  <Card className="h-full overflow-hidden transition-colors group-hover:ring-primary/50">
                    {course.thumbnailUrl ? (
                      <div className="relative aspect-[16/9] bg-background">
                        <Image alt={course.title} className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" fill sizes="(min-width: 768px) 33vw, 100vw" src={course.thumbnailUrl} />
                      </div>
                    ) : <div className="flex aspect-[16/9] items-center justify-center bg-background font-mono text-xs text-muted-foreground">Folio course</div>}
                    <CardContent>
                      <p className="font-mono text-xs text-primary">{course.category ?? course.level.replace("_", " ")}</p>
                      <h3 className="mt-3 font-heading text-2xl tracking-tight">{course.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{course.shortDescription ?? "Explore a structured course with verified enrollment."}</p>
                      <p className="mt-5 font-mono text-sm text-foreground">{Number(course.price) === 0 ? "Free" : `${course.currency} ${course.price}`}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-10 rounded-xl bg-background p-5 text-sm text-muted-foreground ring-1 ring-foreground/10">New courses are being prepared. Browse the catalog to see what is available.</p>
          )}
        </div>
      </section>

      {/* Verification flow */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs tracking-wide text-muted-foreground">
                How verification works
              </p>
              <h2 className="mt-3 max-w-xl font-heading text-3xl tracking-tight md:text-4xl">
                Payment verification without the wait.
              </h2>
            </div>
            <VerifiedSeal className="hidden size-20 shrink-0 -rotate-6 md:block" />
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map((step) => (
              <div key={step.code} className="pt-5">
                <ProgressThread className="mb-5 w-full" />
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-muted-foreground">
                    {step.code}
                  </p>
                  <step.icon className="size-4 text-primary" />
                </div>
                <h3 className="mt-4 font-heading text-xl tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ preview */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="font-mono text-xs tracking-wide text-muted-foreground">Need to know</p>
            <h2 className="mt-3 font-heading text-3xl tracking-tight md:text-4xl">A clearer start.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Learn how verification, course access and secure video work before you enroll.</p>
            <Button asChild className="mt-6" variant="outline"><Link href="/faq">Read all FAQs</Link></Button>
          </div>
          <div className="grid gap-3">
            {["When do I get course access?", "How does payment verification work?", "Can I use a coupon during checkout?"].map((question) => <Card key={question}><CardContent className="flex items-center justify-between gap-4 py-5"><span className="font-heading text-lg">{question}</span><span className="font-mono text-primary">+</span></CardContent></Card>)}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <VerifiedSeal className="mx-auto size-16 text-primary" />
        <h2 className="mx-auto mt-8 max-w-lg font-heading text-3xl tracking-tight md:text-4xl">
          Open your ledger and start teaching.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          Free to set up. Automatic verification gets learners into the right
          course as soon as their payment is confirmed.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href={dashboardPath}>{profile ? "Go to dashboard" : "Create account"}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/courses">Browse courses</Link>
          </Button>
        </div>
      </section>

      <Separator className="bg-border" />

      <footer className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span className="font-mono">© Folio, {new Date().getFullYear()}</span>
          <div className="flex gap-6">
            <Link href="/faq" className="interactive-link">
              FAQ
            </Link>
            <Link href="/about" className="interactive-link">
              About
            </Link>
            <Link href="/contact" className="interactive-link">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
