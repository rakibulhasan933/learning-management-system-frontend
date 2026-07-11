import Link from "next/link"

import {
  signInWithGoogleAction,
  signInWithPasswordAction,
} from "@/app/auth/actions"

interface LoginPageProps {
  searchParams: Promise<{
    error?: string
    next?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <div className="mb-8 h-px w-28 bg-primary" />
          <p className="mb-3 font-mono text-sm text-muted-foreground">
            Continue learning
          </p>
          <h1 className="max-w-2xl text-4xl tracking-tight md:text-6xl">
            Sign in to your LMS workspace.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
            Access your dashboard, course builder, payment status, and learning
            progress from one protected session.
          </p>
        </div>

        <div className="border border-border bg-card p-6">
          <h2 className="text-2xl">Sign in</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your email password or Google account.
          </p>

          {params.error ? (
            <p className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {params.error}
            </p>
          ) : null}

          <form action={signInWithPasswordAction} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={params.next ?? ""} />
            <label className="block text-sm">
              Email
              <input
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
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
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button
              className="w-full bg-primary px-4 py-2 text-primary-foreground"
              type="submit"
            >
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
