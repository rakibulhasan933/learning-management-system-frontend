import Link from "next/link"
import { AlertCircle, CheckCircle2, MailCheck } from "lucide-react"

import { publicApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressThread } from "@/components/ui/progress-thread"

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
      await publicApiFetch(
        `/auth/verify?token=${encodeURIComponent(params.token)}`
      )
      verified = true
    } catch (verifyError) {
      error =
        verifyError instanceof Error
          ? verifyError.message
          : "Verification failed."
    }
  }

  const Icon = verified ? CheckCircle2 : MailCheck

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground sm:px-6">
      <section className="w-full max-w-md">
        <Card>
          <CardContent>
            <ProgressThread className="mb-8" />
            <div className="flex items-center gap-2">
              <Icon
                className={`size-4 ${verified ? "text-secondary" : "text-primary"}`}
              />
              <p className="font-mono text-xs tracking-wide text-muted-foreground">
                {verified ? "Account active" : "Check your inbox"}
              </p>
            </div>
            <h1 className="mt-3 font-heading text-3xl leading-[1.1] tracking-tight sm:text-4xl">
              {verified
                ? "Email verified."
                : isReset
                  ? "Password reset email sent."
                  : "Verify your email."}
            </h1>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              {verified
                ? "Your account is active. You can sign in now."
                : isReset
                  ? "Open the password reset email and follow the secure link to continue."
                  : "Open the verification email to activate your account."}
            </p>

            {error ? (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>{error}</p>
              </div>
            ) : null}

            <div className="mt-8 border-t border-border pt-5">
              <Button
                className="w-full"
                variant={verified ? "default" : "outline"}
                asChild
              >
                <Link href="/auth/login">Back to sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
