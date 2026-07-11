import Link from "next/link"

import { signOutAction } from "@/app/auth/actions"

export const dynamic = "force-dynamic"

export default function InstructorDashboardPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Instructor dashboard
        </p>
        <h1 className="mt-3 text-4xl tracking-tight">Course operations</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Course creation, student lists, analytics, payout requests, and lecture
          uploads will be added here after the auth flow is complete.
        </p>
        <Link
          className="mt-8 inline-block bg-primary px-4 py-2 text-sm text-primary-foreground"
          href="/dashboard/instructor/courses"
        >
          Manage courses
        </Link>
        <form action={signOutAction} className="mt-6">
          <button
            className="border border-border px-4 py-2 text-sm text-foreground"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  )
}
