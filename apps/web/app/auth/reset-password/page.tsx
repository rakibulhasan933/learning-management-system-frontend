import Link from "next/link"

import {
  confirmPasswordResetAction,
  sendPasswordResetAction,
} from "@/app/auth/actions"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { FloatingInput } from "@workspace/ui/components/floating-input"

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
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <Card className="border-border bg-card">
          <CardContent className="grid gap-5 p-6">
            <div className="space-y-2">
              <h1 className="font-display text-3xl tracking-tight">
                Reset your password
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {token
                  ? "Choose a new password to finish the reset."
                  : "Enter your email and we will send a secure reset link."}
              </p>
            </div>

            {params.error ? (
              <Alert variant="destructive">
                <AlertDescription>{params.error}</AlertDescription>
              </Alert>
            ) : null}

            {token ? (
              <form action={confirmPasswordResetAction} className="grid gap-5">
                <input type="hidden" name="token" value={token} />
                <FloatingInput
                  label="New password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                />
                <Button className="w-full" type="submit">
                  Update password
                </Button>
              </form>
            ) : (
              <form action={sendPasswordResetAction} className="grid gap-5">
                <FloatingInput
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                />
                <Button className="w-full" type="submit">
                  Send reset link
                </Button>
              </form>
            )}

            <p className="text-sm text-muted-foreground">
              Remembered it?{" "}
              <Link className="text-primary hover:underline" href="/auth/login">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
