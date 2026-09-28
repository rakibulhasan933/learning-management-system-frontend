import Link from "next/link"
import { redirect } from "next/navigation"
import type { ProfileDto } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { getDashboardPath } from "@/lib/auth/dashboard"
import { BrandMark } from "@/components/brand-mark"
import { ProgressThread } from "@workspace/ui/components/progress-thread"
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
    profile = await authenticatedApiFetch<ProfileDto>("/auth/me", {
      cache: "no-store",
    })
  } catch {
    // Anonymous visitors should see the login form.
  }
  if (profile) redirect(getDashboardPath(profile.role))

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1fr_480px]">
      <section className="hidden flex-col justify-between border-r border-border px-12 py-12 lg:flex">
        <BrandMark />
        <div className="max-w-md">
          <p className="font-mono text-xs text-primary">
            Student · instructor · admin
          </p>
          <h1 className="mt-4 font-heading text-4xl leading-[1.1] tracking-tight">
            Pick up where you left the lesson.
          </h1>
          <ProgressThread className="mt-8 w-20" />
          <p className="mt-6 text-sm leading-7 text-muted-foreground">
            Sign in to continue a course, review payments, or open the workspace
            for your role.
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">Folio LMS</p>
      </section>

      <section className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 space-y-4 lg:hidden">
            <BrandMark />
            <h1 className="font-heading text-3xl tracking-tight">Sign in</h1>
          </div>
          <div className="mb-8 hidden space-y-2 lg:block">
            <h1 className="font-heading text-3xl tracking-tight">Sign in</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Verified courses, tracked progress.
            </p>
          </div>
          <LoginForm next={params.next} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link className="interactive-link text-primary" href="/auth/signup">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
