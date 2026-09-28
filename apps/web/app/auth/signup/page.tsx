import Link from "next/link"
import { redirect } from "next/navigation"
import type { ProfileDto } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { getDashboardPath } from "@/lib/auth/dashboard"
import { BrandMark } from "@/components/brand-mark"
import { ProgressThread } from "@workspace/ui/components/progress-thread"
import { SignupForm } from "./signup-form"

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
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1fr_480px]">
      <section className="hidden flex-col justify-between border-r border-border px-12 py-12 lg:flex">
        <BrandMark />
        <div className="max-w-md">
          <p className="font-mono text-xs text-primary">Start as a student</p>
          <h1 className="mt-4 font-heading text-4xl leading-[1.1] tracking-tight">
            Create an account and open your first course.
          </h1>
          <ProgressThread className="mt-8 w-20" />
          <p className="mt-6 text-sm leading-7 text-muted-foreground">
            New accounts start as students. An admin can grant instructor access
            after verification.
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">Folio LMS</p>
      </section>

      <section className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 space-y-4 lg:hidden">
            <BrandMark />
            <h1 className="font-heading text-3xl tracking-tight">
              Create your account
            </h1>
          </div>
          <div className="mb-8 hidden space-y-2 lg:block">
            <h1 className="font-heading text-3xl tracking-tight">
              Create your account
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              New accounts start as students.
            </p>
          </div>
          <SignupForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
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
