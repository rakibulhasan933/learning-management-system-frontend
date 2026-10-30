import Link from "next/link"
import { redirect } from "next/navigation"
import type { ProfileDto } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { getDashboardPath } from "@/lib/auth/dashboard"
import { BrandMark } from "@/components/brand-mark"
import { VerifiedSeal } from "@/components/verified-seal"
import { ProgressThread } from "@/components/ui/progress-thread"
import { LoginForm } from "./login-form"

interface LoginPageProps {
  searchParams: Promise<{
    next?: string
  }>
}

const assurances = [
  "যাচাই করা পেমেন্ট",
  "সুরক্ষিত ভিডিও",
  "সেভ থাকা অগ্রগতি",
] as const

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  let profile: ProfileDto | null = null
  try {
    profile = await authenticatedApiFetch<ProfileDto>("/auth/me", {
      cache: "no-store",
    })
  } catch {
    // Anonymous visitors should see the login form.
  }
  if (profile) redirect(getDashboardPath(profile.role))

  return (
    <main className="auth-page grid min-h-screen bg-background text-foreground md:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      {/* LEFT: brand panel */}
      <section className="auth-brand-panel relative hidden min-h-[520px] flex-col justify-between overflow-hidden border-r border-border px-8 py-10 md:flex md:px-10 lg:px-14 lg:py-12">
        <div
          aria-hidden
          className="hairline-grid pointer-events-none absolute inset-0"
        />

        <div className="relative">
          <BrandMark />
        </div>

        <div className="relative max-w-lg">
          <p className="eyebrow">শিক্ষার্থী · ইন্সট্রাক্টর · অ্যাডমিন</p>
          <h1 className="mt-6 font-heading text-6xl leading-[1.04] font-light tracking-[-0.03em]">
            যেখানে থেমেছিলেন,
            <span className="text-primary italic"> সেখান থেকেই শুরু করুন।</span>
          </h1>
          <ProgressThread className="mt-8 w-20" />
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
            কোর্স চালিয়ে যান, পেমেন্টের অবস্থা দেখুন, অথবা আপনার workspace
            খুলুন।
          </p>

          {/* Sample resume card */}
          <div className="surface-raised relative mt-12 max-w-sm rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="eyebrow">চালিয়ে যান</p>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                68%
              </span>
            </div>
            <p className="mt-4 font-heading text-xl font-light tracking-tight">
              Advanced web systems
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              ক্লাস ৩ · কিউ ও ওয়ার্কার
            </p>
            <ProgressThread className="mt-5 w-full" value={68} />
            <VerifiedSeal className="absolute -top-5 -right-5 size-16 rotate-[8deg] rounded-full bg-background" />
          </div>
        </div>

        <ul className="relative flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          {assurances.map((a) => (
            <li className="flex items-center gap-2" key={a}>
              <span className="size-1 rounded-full bg-primary" />
              {a}
            </li>
          ))}
        </ul>
      </section>

      {/* RIGHT: form */}
      <section className="auth-form-panel flex flex-col justify-center px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 md:hidden">
            <BrandMark />
          </div>

          <div className="mb-8">
            <p className="eyebrow">আবার স্বাগতম</p>
            <h2 className="mt-4 font-heading text-4xl font-light tracking-[-0.02em]">
              লগইন করুন
            </h2>
            <ProgressThread className="mt-5 w-12" />
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              আপনার কোর্স ও শেখার অগ্রগতি এক জায়গায় রাখুন।
            </p>
          </div>

          <LoginForm next={params.next} />

          <p className="mt-8 text-center text-sm text-muted-foreground">
            নতুন?{" "}
            <Link className="interactive-link text-primary" href="/auth/signup">
              অ্যাকাউন্ট খুলুন
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
