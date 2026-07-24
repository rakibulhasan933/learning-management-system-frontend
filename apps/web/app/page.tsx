import Link from "next/link"

import { SiteHeader } from "@/components/site-header"

export default async function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-10 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <div className="mb-10 h-px w-32 bg-primary" />
          <p className="mb-4 font-mono text-sm text-muted-foreground">
            Premium LMS platform
          </p>
          <h1 className="max-w-3xl text-5xl tracking-tight md:text-7xl">
            Teach, verify payments, and track learning from one workspace.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
            A dark-first learning platform for admins, instructors, and students,
            built around course progress, manual payment verification, and secure
            video delivery.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="bg-primary px-5 py-3 text-sm text-primary-foreground"
              href="/auth/signup"
            >
              Create account
            </Link>
            <Link
              className="border border-border px-5 py-3 text-sm text-foreground"
              href="/auth/login"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="border border-border bg-card p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <p className="font-mono text-sm text-muted-foreground">ORD-482913</p>
            <span className="bg-secondary px-3 py-1 text-xs text-secondary-foreground">
              Pending
            </span>
          </div>
          <div className="space-y-5 pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Course</p>
              <p className="mt-1 text-xl">Advanced web systems</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-5">
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="mt-1 font-mono text-2xl">68%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="mt-1 font-mono text-2xl">BDT 4,500</p>
              </div>
            </div>
            <div className="h-px w-full bg-primary" />
          </div>
        </div>
      </section>
    </main>
  )
}
