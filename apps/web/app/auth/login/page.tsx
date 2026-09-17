import Link from "next/link"

import { SiteHeader } from "@/components/site-header"

export const metadata = { title: "Welcome back" }

import {
  resendVerificationEmailAction,
  signInWithGoogleAction,
  signInWithPasswordAction,
} from "@/app/auth/actions"

interface LoginPageProps {
  searchParams: Promise<{
    error?: string
    next?: string
    unverifiedEmail?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return (
    <main className="auth-page">
      <SiteHeader />
      <section className="page-container grid gap-12 lg:grid-cols-[1fr_440px] lg:items-center lg:gap-24">
        <div>
          <p className="eyebrow mb-6">Continue learning</p>
          <h1 className="max-w-2xl text-4xl tracking-tight md:text-6xl">
            Your next chapter
            <br />
            is waiting for you.
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
            Good to see you again. Pick up where you left off, discover
            something new, and keep moving toward your goals.
          </p>
          <div className="mt-10 flex items-center gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
            <span className="text-primary">01 —</span> A little progress, every
            day.
          </div>
        </div>

        <div className="auth-panel">
          <h2>Welcome back.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to make space for what’s next.
          </p>

          {params.error ? (
            <p className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {params.error}
            </p>
          ) : null}

          {params.unverifiedEmail ? (
            <form action={resendVerificationEmailAction} className="mt-3">
              <input
                type="hidden"
                name="email"
                value={params.unverifiedEmail}
              />
              <button
                className="text-sm text-primary hover:text-foreground"
                type="submit"
              >
                Resend verification email
              </button>
            </form>
          ) : null}

          <form action={signInWithPasswordAction} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={params.next ?? ""} />
            <label className="block text-sm">
              Email
              <input
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                placeholder="you@example.com"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label className="block text-sm">
              Password
              <input
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                placeholder="Enter your password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button className="button-primary w-full" type="submit">
              Sign in
            </button>
          </form>

          <form action={signInWithGoogleAction} className="mt-3">
            <input type="hidden" name="next" value={params.next ?? ""} />
            <button
              className="w-full border border-border px-4 py-2 text-foreground"
              type="submit"
            >
              Continue with Google
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <Link className="hover:text-foreground" href="/auth/signup">
              Create account
            </Link>
            <Link className="hover:text-foreground" href="/auth/reset-password">
              Reset password
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
