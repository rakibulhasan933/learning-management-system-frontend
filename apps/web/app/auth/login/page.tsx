import Link from "next/link"
import { redirect } from "next/navigation"
import type { ProfileDto } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { getDashboardPath } from "@/lib/auth/dashboard"
import { LoginForm } from "./login-form"

interface LoginPageProps {
  searchParams: Promise<{
    next?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  let profile: ProfileDto | null = null
  try {
    profile = await authenticatedApiFetch<ProfileDto>("/auth/me", { cache: "no-store" })
  } catch {
    // Anonymous visitors should see the login form.
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
            <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">Sign in</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Verified courses, tracked progress.
            </p>
          </div>
        </div>

        <LoginForm next={params.next} />
      </section>
    </main>
  )
}
