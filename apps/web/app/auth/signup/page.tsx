import Link from "next/link"
import { redirect } from "next/navigation"
import type { ProfileDto } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { getDashboardPath } from "@/lib/auth/dashboard"
import { SignupForm } from "./signup-form"

export default async function SignupPage() {
  let profile: ProfileDto | null = null
  try {
    profile = await authenticatedApiFetch<ProfileDto>("/auth/me", { cache: "no-store" })
  } catch {
    // Anonymous visitors should see the signup form.
  }
  if (profile) redirect(getDashboardPath(profile.role))

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-border"
      />

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center sm:min-h-[calc(100vh-6rem)]">
        <div className="mb-8 space-y-4 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg font-mono text-xs text-primary ring-1 ring-primary/60">
              F
            </span>
            <span className="font-heading text-lg tracking-tight">Folio</span>
          </Link>
          <div className="space-y-2">
            <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
              Create your account
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              New accounts start as students. Instructor access can be granted
              by an admin after verification.
            </p>
          </div>
        </div>

        <SignupForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="interactive-link text-primary" href="/auth/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
