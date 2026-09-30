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
  { code: "০১", title: "অ্যাকাউন্ট খুলুন", done: true },
  { code: "০২", title: "ইমেইল যাচাই করুন", done: false },
  { code: "০৩", title: "প্রথম কোর্স খুলুন", done: false },
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
          <p className="eyebrow">শিক্ষার্থী হিসেবে শুরু করুন</p>
          <h1 className="mt-6 font-heading text-6xl leading-[1.04] font-light tracking-[-0.03em]">
            অ্যাকাউন্ট খুলে
            <span className="text-primary italic"> প্রথম কোর্স শুরু করুন।</span>
          </h1>
          <ProgressThread className="mt-8 w-20" />
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
            নতুন অ্যাকাউন্ট শিক্ষার্থী হিসেবে শুরু হয়। যাচাইয়ের পর অ্যাডমিন ইন্সট্রাক্টর access দিতে পারেন।
          </p>

          {/* Path card */}
          <div className="surface-raised relative mt-12 max-w-sm rounded-2xl p-5">
            <p className="eyebrow">আপনার পথ</p>
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
          Folio LMS · যাচাই করা এনরোলমেন্ট
        </p>
      </section>

      {/* RIGHT: form */}
      <section className="auth-form-panel flex flex-col justify-center px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 md:hidden">
            <BrandMark />
          </div>

          <div className="mb-8">
            <p className="eyebrow">শুরু করুন</p>
            <h2 className="mt-4 font-heading text-4xl font-light tracking-[-0.02em]">
              আপনার অ্যাকাউন্ট খুলুন
            </h2>
            <ProgressThread className="mt-5 w-12" />
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              নতুন অ্যাকাউন্ট শিক্ষার্থী হিসেবে শুরু হয়।
            </p>
          </div>

          <SignupForm />

          <p className="mt-8 text-center text-sm text-muted-foreground">
            আগে থেকেই অ্যাকাউন্ট আছে?{" "}
            <Link className="interactive-link text-primary" href="/auth/login">
              লগইন করুন
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
