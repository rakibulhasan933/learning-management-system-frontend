import Link from "next/link"
import { redirect } from "next/navigation"
import type { ProfileDto } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { getDashboardPath } from "@/lib/auth/dashboard"
import { BrandMark } from "@/components/brand-mark"
import { VerifiedSeal } from "@/components/verified-seal"
import { ProgressThread } from "@/components/ui/progress-thread"
import { SignupForm } from "./signup-form"

const path = [
  { code: "01", title: "Create your account", done: true },
  { code: "02", title: "Verify your email", done: false },
  { code: "03", title: "Open your first course", done: false },
] as const

export default async function SignupPage() {
  let profile: ProfileDto | null = null
  try {
    profile = await authenticatedApiFetch<ProfileDto>("/auth/me", {
      cache: "no-store",
    })
  } catch {
    // Anonymous visitors should see the signup form.
  }
  if (profile) redirect(getDashboardPath(profile.role))

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_520px]">
      {/* LEFT: brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-border px-14 py-12 lg:flex">
        <div
          aria-hidden
          className="hairline-grid pointer-events-none absolute inset-0"
        />

        <div className="relative">
          <BrandMark />
        </div>

        <div className="relative max-w-lg">
          <p className="eyebrow">Start as a student</p>
          <h1 className="mt-6 font-heading text-6xl leading-[1.04] font-light tracking-[-0.03em]">
            Create an account and
            <span className="text-primary italic"> open your first course.</span>
          </h1>
          <ProgressThread className="mt-8 w-20" />
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
            New accounts start as students. An admin can grant instructor
            access after verification.
          </p>

          {/* Path card */}
          <div className="surface-raised relative mt-12 max-w-sm rounded-2xl p-5">
            <p className="eyebrow">Your path</p>
            <ol className="mt-5 space-y-4">
              {path.map((step) => (
                <li className="flex items-center gap-4" key={step.code}>
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] ring-1 ${step.done
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "text-muted-foreground ring-foreground/20"
                      }`}
                  >
                    {step.code}
                  </span>
                  <span
                    className={`text-sm ${step.done ? "text-foreground" : "text-muted-foreground"
                      }`}
                  >
                    {step.title}
                  </span>
                </li>
              ))}
            </ol>
            <VerifiedSeal className="absolute -top-5 -right-5 size-16 rotate-[8deg] rounded-full bg-background" />
          </div>
        </div>

        <p className="relative font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Folio LMS · Verified enrollment
        </p>
      </section>

      {/* RIGHT: form */}
      <section className="flex flex-col justify-center px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <BrandMark />
          </div>

          <div className="mb-8">
            <p className="eyebrow">Get started</p>
            <h2 className="mt-4 font-heading text-4xl font-light tracking-[-0.02em]">
              Create your account
            </h2>
            <ProgressThread className="mt-5 w-12" />
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              New accounts start as students.
            </p>
          </div>

          <SignupForm />

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="interactive-link text-primary" href="/auth/login">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}