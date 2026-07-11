import Link from "next/link"

import {
  confirmPasswordResetAction,
  sendPasswordResetAction,
} from "@/app/auth/actions"

interface ResetPasswordPageProps {
  searchParams: Promise<{
    error?: string
    token?: string
  }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams
  const token = params.token

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-md border border-border bg-card p-6">
        <div className="mb-6 h-px w-24 bg-primary" />
        <h1 className="text-3xl">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {token
            ? "Choose a new password to finish the reset."
            : "Enter your email and we will send a secure reset link."}
        </p>

        {params.error ? (
          <p className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {params.error}
          </p>
        ) : null}

        {token ? (
          <form action={confirmPasswordResetAction} className="mt-6 space-y-4">
            <input type="hidden" name="token" value={token} />
            <label className="block text-sm">
              New password
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
              Update password
            </button>
          </form>
        ) : (
          <form action={sendPasswordResetAction} className="mt-6 space-y-4">
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
            <button
              className="w-full bg-primary px-4 py-2 text-primary-foreground"
              type="submit"
            >
              Send reset link
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link className="text-foreground" href="/auth/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
