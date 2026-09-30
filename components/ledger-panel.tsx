import Link from "next/link"

import { VerifiedSeal } from "@/components/verified-seal"
import { ProgressThread } from "@/components/ui/progress-thread"

const stats = [
  { value: "12,400", label: "Verified enrollments" },
  { value: "340", label: "Active instructors" },
  { value: "98%", label: "Verified within 24h" },
]

export function LedgerPanel() {
  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-card px-14 py-14 lg:flex">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
        }}
      />
      <VerifiedSeal className="pointer-events-none absolute -bottom-16 -left-16 size-96 -rotate-12 opacity-[0.07]" />

      <Link href="/" className="relative flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg font-mono text-xs text-primary ring-1 ring-primary/60">
          F
        </span>
        <span className="font-heading text-xl tracking-tight">Folio</span>
      </Link>

      <div className="relative max-w-md">
        <ProgressThread className="mb-7 w-16" />
        <h1 className="font-heading text-4xl leading-[1.15] font-light tracking-tight">
          Every enrollment,{" "}
          <span className="text-primary italic">verified</span> before it
          counts.
        </h1>
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          Payments checked by a person, not assumed by a webhook. Admins verify,
          instructors teach, students learn.
        </p>
      </div>

      <div className="relative flex gap-10 border-t border-border pt-6">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-mono text-xl text-primary">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
