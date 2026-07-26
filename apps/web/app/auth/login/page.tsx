import Link from "next/link"

import { LoginForm } from "./login-form"

interface LoginPageProps {
  searchParams: Promise<{
    next?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-border"
      />

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center sm:min-h-[calc(100vh-6rem)]">
        <div className="mb-8 space-y-4 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center border border-primary font-mono text-xs text-primary">
              F
            </span>
            <span className="font-display text-lg tracking-tight">Folio</span>
          </Link>
          <div className="space-y-2">
            <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Sign in</h1>
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
