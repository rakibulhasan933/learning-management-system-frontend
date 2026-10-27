import type { Metadata } from "next"

import { PublicShell } from "@/components/public-shell"
import { ProgressThread } from "@/components/ui/progress-thread"

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that apply when you use Folio.",
}

export default function TermsPage() {
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <ProgressThread className="mb-8 w-24" />
        <p className="font-mono text-xs text-muted-foreground">
          Legal · Terms of service
        </p>
        <h1 className="mt-3 font-heading text-4xl tracking-tight sm:text-5xl">
          Terms of service
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">
          Last updated: October 20, 2026
        </p>

        <div className="mt-10 space-y-10 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="font-heading text-2xl text-foreground">
              Using Folio
            </h2>
            <p className="mt-3">
              You must provide accurate account information, keep your
              credentials private, and use Folio only for lawful learning
              activity. You are responsible for activity performed through your
              account.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-2xl text-foreground">
              Course access
            </h2>
            <p className="mt-3">
              Course access is personal, limited to the enrollment granted to
              your account, and may be suspended or revoked for a refunded,
              reversed, fraudulent, or otherwise invalid transaction. Course
              materials may not be copied, redistributed, resold, or shared.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-2xl text-foreground">
              Learning submissions
            </h2>
            <p className="mt-3">
              You keep responsibility for the content you submit. Do not upload
              content that is unlawful, abusive, infringing, or harmful to
              others. We may remove content that violates these terms.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-2xl text-foreground">
              Availability and changes
            </h2>
            <p className="mt-3">
              We work to keep Folio reliable, but features may change and
              temporary interruptions may occur for maintenance, security, or
              circumstances outside our control. We may update these terms when
              the service changes.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-2xl text-foreground">Contact</h2>
            <p className="mt-3">
              Questions about these terms can be sent to{" "}
              <a
                className="text-primary underline underline-offset-4"
                href="mailto:rakibulmd933@gmail.com"
              >
                rakibulmd933@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </PublicShell>
  )
}
