import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, PlayCircle, ShieldCheck, Upload } from "lucide-react"
import type { CourseListResponse, ProfileDto } from "@workspace/types"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { ProgressThread } from "@workspace/ui/components/progress-thread"

import { PublicShell } from "@/components/public-shell"
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
    tag: "Admin",
    title: "Keeps the catalog honest",
    body: "Reviews payments, manages access, and sees which courses are actually moving.",
  },
  {
    tag: "Instructor",
    title: "Builds the course",
    body: "Structures milestones, uploads lessons, and follows student progress in one workspace.",
  },
  {
    tag: "Student",
    title: "Learns without noise",
    body: "Enrolls, pays, then watches secured video with a clear outline and saved progress.",
  },
]

const steps = [
  {
    code: "01",
    title: "Choose a course",
    body: "Open a published course and start checkout with the price already in view.",
    icon: CheckCircle2,
  },
  {
    code: "02",
    title: "Apply a coupon",
    body: "Enter an active code and see the final amount from the server, not a guess.",
    icon: Upload,
  },
  {
    code: "03",
    title: "Pay the exact amount",
    body: "Send the shown amount through the payment method on the order.",
    icon: ShieldCheck,
  },
  {
    code: "04",
    title: "Access opens",
    body: "Once payment is verified, the course unlocks and you can continue learning.",
    icon: PlayCircle,
  },
]

const faqs = [
  {
    q: "When do I get course access?",
    a: "After payment is verified. Pending orders stay locked until then.",
  },
  {
    q: "How does payment verification work?",
    a: "You pay outside the app, submit proof, and access opens when the order is marked paid.",
  },
  {
    q: "Can I use a coupon during checkout?",
    a: "Yes. Apply it before paying so the order records the discounted amount.",
  },
]

export default async function Page() {
  let profile: ProfileDto | null = null
  try {
    profile = await authenticatedApiFetch<ProfileDto>("/auth/me", {
      cache: "no-store",
    })
  } catch {
    // Anonymous visitors see the public CTA.
  }
  let featuredCourses: CourseListResponse["courses"] = []
  try {
    const response = await publicApiFetch<CourseListResponse>(
      "/courses?page=1&pageSize=3",
      { next: { revalidate: 300 } }
    )
    featuredCourses = response.courses
  } catch {
    // The marketing page remains useful when the catalog API is unavailable.
  }
  const dashboardPath = profile
    ? getDashboardPath(profile.role)
    : "/auth/signup"

  return (
    <PublicShell>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            description:
              "Verified online learning with structured courses and secure video.",
            name: "Folio",
            url:
              process.env.NEXT_PUBLIC_SITE_URL ?? "https://folio.example.com",
          }),
        }}
        type="application/ld+json"
      />

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16 lg:py-24">
        <div>
          <Badge
            variant="outline"
            className="mb-6 border-primary/40 font-mono text-xs text-primary"
          >
            Premium LMS · verified enrollment
          </Badge>
          <h1 className="max-w-2xl font-heading text-4xl leading-[1.08] font-light tracking-tight sm:text-5xl md:text-6xl">
            Learn in a workspace that
            <span className="text-primary italic"> actually stays clear.</span>
          </h1>
          <ProgressThread className="mt-8 w-24" />
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
            Folio is a dark-first learning platform for structured courses,
            verified payments, and secure video. Instructors teach, students
            continue, and every enrollment has a record.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={dashboardPath}>
                {profile ? "Go to dashboard" : "Create account"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">Browse courses</Link>
            </Button>
          </div>
        </div>

        <div className="relative rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
          <div className="absolute top-0 right-8 left-8 h-px bg-primary" />
          <div className="flex items-center justify-between border-b border-border pb-4">
            <p className="font-mono text-sm text-muted-foreground">
              ORD-482913
            </p>
            <Badge
              variant="outline"
              className="border-primary/40 font-mono text-xs text-primary"
            >
              In progress
            </Badge>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary/20 font-mono text-sm text-secondary">
              01
            </div>
            <div>
              <p className="font-mono text-[10px] text-muted-foreground">
                Current learning path
              </p>
              <p className="mt-1 text-sm text-foreground">Keep the thread moving.</p>
            </div>
          </div>
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm text-muted-foreground">Course</p>
              <p className="mt-1 font-heading text-xl">Advanced web systems</p>
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
          <VerifiedSeal className="absolute -top-5 -right-4 size-20 rotate-[8deg] rounded-full bg-background sm:-right-6 sm:size-24" />
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <dl className="mx-auto grid max-w-6xl gap-px bg-border sm:grid-cols-3">
          {stats.map((s) => (
            <div className="bg-background px-4 py-10 sm:px-8" key={s.label}>
              <dd className="font-mono text-3xl text-primary tabular-nums">
                {s.value}
              </dd>
              <dt className="mt-2 max-w-[12rem] text-sm leading-5 text-muted-foreground">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="font-mono text-xs text-muted-foreground">
          Three roles, one workspace
        </p>
        <h2 className="mt-3 max-w-xl font-heading text-3xl tracking-tight md:text-4xl">
          Everyone sees exactly what their role needs.
        </h2>
        <ProgressThread className="mt-6 w-16" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {roles.map((r) => (
            <Card key={r.tag}>
              <CardContent>
                <p className="font-mono text-xs text-secondary">{r.tag}</p>
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

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs text-muted-foreground">
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
                <Link
                  className="group"
                  href={`/courses/${course.slug}`}
                  key={course.id}
                >
                  <Card className="h-full overflow-hidden transition-colors group-hover:ring-primary/40">
                    {course.thumbnailUrl ? (
                      <div className="relative aspect-[16/9] bg-background">
                        <Image
                          alt={course.title}
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          fill
                          sizes="(min-width: 768px) 33vw, 100vw"
                          src={course.thumbnailUrl}
                        />
                      </div>
                    ) : (
                      <div className="relative flex aspect-[16/9] items-end bg-background p-5">
                        <ProgressThread className="absolute top-6 right-5 left-5 w-auto" />
                        <span className="font-heading text-2xl text-foreground">
                          Folio course
                        </span>
                      </div>
                    )}
                    <CardContent>
                      <p className="font-mono text-xs text-primary">
                        {course.category ?? course.level.replace("_", " ")}
                      </p>
                      <h3 className="mt-3 font-heading text-2xl tracking-tight">
                        {course.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {course.shortDescription ??
                          "Explore a structured course with verified enrollment."}
                      </p>
                      <p className="mt-5 font-mono text-sm text-foreground">
                        {Number(course.price) === 0
                          ? "Free"
                          : `${course.currency} ${course.price}`}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-10 rounded-xl bg-background p-5 text-sm text-muted-foreground ring-1 ring-foreground/10">
              New courses are being prepared. Browse the catalog to see what is
              available.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              How enrollment works
            </p>
            <h2 className="mt-3 max-w-xl font-heading text-3xl tracking-tight md:text-4xl">
              Four steps from browse to access.
            </h2>
          </div>
          <VerifiedSeal className="hidden size-20 shrink-0 -rotate-6 md:block" />
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {steps.map((step) => (
            <div key={step.code}>
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
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              Need to know
            </p>
            <h2 className="mt-3 font-heading text-3xl tracking-tight md:text-4xl">
              A clearer start.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              Learn how verification, course access, and secure video work
              before you enroll.
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link href="/faq">Read all FAQs</Link>
            </Button>
          </div>
          <div className="grid gap-3">
            {faqs.map((item) => (
              <Card key={item.q}>
                <CardContent className="py-5">
                  <p className="font-heading text-lg">{item.q}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-24">
        <VerifiedSeal className="mx-auto size-16 text-primary" />
        <h2 className="mx-auto mt-8 max-w-lg font-heading text-3xl tracking-tight md:text-4xl">
          Open your workspace and start.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          Free to set up. Learners enter a course as soon as their payment is
          confirmed.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href={dashboardPath}>
              {profile ? "Go to dashboard" : "Create account"}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/courses">Browse courses</Link>
          </Button>
        </div>
      </section>
    </PublicShell>
  )
}
