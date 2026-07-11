import { signOutAction } from "@/app/auth/actions"

export const dynamic = "force-dynamic"

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">Admin dashboard</p>
        <h1 className="mt-3 text-4xl tracking-tight">Platform control center</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          User management, course approval, revenue reporting, and pending manual
          payment review will be built here.
        </p>
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
