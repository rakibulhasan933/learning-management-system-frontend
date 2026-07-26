import Link from "next/link"

import { VerifiedSeal } from "@/components/verified-seal"

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
        className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
        }}
      />
      <VerifiedSeal className="pointer-events-none absolute -bottom-16 -left-16 h-96 w-96 -rotate-12 opacity-[0.07]" />

      <Link href="/" className="relative flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center border border-primary font-mono text-xs text-primary">
          F
        </span>
        <span className="font-display text-xl tracking-tight">Folio</span>
      </Link>

      <div className="relative max-w-md">
        <div className="mb-7 h-px w-16 bg-primary" />
        <h1 className="font-display text-4xl font-light leading-[1.15] tracking-tight">
          Every enrollment,{" "}
          <span className="italic text-primary">verified</span> before it
          counts.
        </h1>
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          Payments checked by a person, not assumed by a webhook. Admins
          verify, instructors teach, students learn.
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
