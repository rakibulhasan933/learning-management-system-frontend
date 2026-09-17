import Link from "next/link"

import { SiteHeader } from "@/components/site-header"

export const metadata = { title: "Start your journey" }

import { signUpWithPasswordAction } from "@/app/auth/actions"

interface SignupPageProps {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams

  return (
    <main className="auth-page">
      <SiteHeader />
      <section className="page-container grid items-center gap-12 lg:grid-cols-[1fr_440px] lg:gap-24">
        <div>
          <p className="eyebrow">A new beginning</p>
          <h1 className="mt-6 text-5xl tracking-[-.045em] sm:text-6xl">
            Great things start
            <br />
            with a little curiosity.
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
            Make an investment in yourself. Create your account and find the
            course that takes you somewhere new.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
            <li>
              <span className="mr-3 text-primary">✓</span> Learn on your own
              schedule
            </li>
            <li>
              <span className="mr-3 text-primary">✓</span> Keep every milestone
              in one place
            </li>
            <li>
              <span className="mr-3 text-primary">✓</span> Turn knowledge into
              practical skills
            </li>
          </ul>
        </div>
        <div className="auth-panel">
          <h2>Create your account.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            New accounts start as students. Instructor access can be granted by
            an admin after verification.
          </p>

          {params.error ? (
            <p className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {params.error}
            </p>
          ) : null}

          <form action={signUpWithPasswordAction} className="mt-6 space-y-4">
            <label className="block text-sm">
              Full name
              <input
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                placeholder="Your full name"
                name="fullName"
                type="text"
                autoComplete="name"
              />
            </label>
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
                placeholder="At least 8 characters"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button className="button-primary w-full" type="submit">
              Create account
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="text-foreground" href="/auth/login">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
