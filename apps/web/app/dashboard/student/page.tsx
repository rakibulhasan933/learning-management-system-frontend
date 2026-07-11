import { signOutAction } from "@/app/auth/actions"
import { authenticatedApiFetch } from "@/lib/api-client"
import type { ProfileDto } from "@workspace/types"

export const dynamic = "force-dynamic"

export default async function StudentDashboardPage() {
  const profile = await authenticatedApiFetch<ProfileDto>("/auth/me")

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Student dashboard
        </p>
        <h1 className="mt-3 text-4xl tracking-tight">Your learning workspace</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Course progress, payment status, certificates, and resume points will
          be built here after the catalog and enrollment flow are connected.
        </p>
        <div className="mt-8 border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="mt-1 font-mono text-sm">{profile.email}</p>
        </div>
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
