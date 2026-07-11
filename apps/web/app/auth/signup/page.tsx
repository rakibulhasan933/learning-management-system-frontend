import Link from "next/link"

import { signUpWithPasswordAction } from "@/app/auth/actions"

interface SignupPageProps {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-md border border-border bg-card p-6">
        <div className="mb-6 h-px w-24 bg-primary" />
        <h1 className="text-3xl">Create your account</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          New accounts start as students. Instructor access can be granted by an
          admin after verification.
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
              name="fullName"
              type="text"
              autoComplete="name"
            />
          </label>
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
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <button
            className="w-full bg-primary px-4 py-2 text-primary-foreground"
            type="submit"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="text-foreground" href="/auth/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
