import Link from "next/link"

import { publicApiFetch } from "@/lib/api-client"

interface VerifyPageProps {
  searchParams: Promise<{
    error?: string
    mode?: string
    token?: string
  }>
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams
  const isReset = params.mode === "reset"
  let verified = false
  let error = params.error ?? null

  if (params.token) {
    try {
      await publicApiFetch(`/auth/verify?token=${encodeURIComponent(params.token)}`)
      verified = true
    } catch (verifyError) {
      error =
        verifyError instanceof Error
          ? verifyError.message
          : "Verification failed."
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-md border border-border bg-card p-5 sm:p-6">
        <div className="mb-6 h-px w-24 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Check your inbox
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl">
          {verified
            ? "Email verified."
            : isReset
              ? "Password reset email sent."
              : "Verify your email."}
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {verified
            ? "Your account is active. You can sign in now."
            : isReset
              ? "Open the password reset email and follow the secure link to continue."
              : "Open the verification email to activate your account."}
        </p>
        {error ? (
          <p className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Link className="mt-6 inline-flex bg-primary px-4 py-2 text-primary-foreground" href="/auth/login">
          Back to sign in
        </Link>
      </section>
    </main>
  )
}
