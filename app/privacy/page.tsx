import type { Metadata } from "next"

import { PublicShell } from "@/components/public-shell"
import { ProgressThread } from "@/components/ui/progress-thread"

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Folio collects, uses and protects account and learning data.",
}

export default function PrivacyPage() {
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <ProgressThread className="mb-8 w-24" />
        <p className="font-mono text-xs text-muted-foreground">
          Legal · Privacy policy
        </p>
        <h1 className="mt-3 font-heading text-4xl tracking-tight sm:text-5xl">
          Privacy policy
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">
          Last updated: October 20, 2026
        </p>

        <div className="mt-10 space-y-10 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="font-heading text-2xl text-foreground">
              Information we collect
            </h2>
            <p className="mt-3">
              When you use Folio, we may collect your name, email address,
              password credentials, profile information, course enrollment,
              learning progress, quiz and assignment submissions, certificate
              records, and support messages. If you submit payment proof on the
              web platform, we may also process the sender number and
              transaction ID you provide for automatic verification via
              PayConfirm.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-2xl text-foreground">
              How we use information
            </h2>
            <p className="mt-3">
              We use this information to authenticate accounts, provide course
              access, track progress, grade learning activities, issue
              certificates, verify payments, respond to support requests, and
              protect the platform from abuse. We do not sell personal
              information.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-2xl text-foreground">
              Storage and service providers
            </h2>
            <p className="mt-3">
              Folio uses third-party infrastructure providers for database
              hosting, file storage, video delivery, image uploads, email
              delivery, and application operation. These providers process
              information only as needed to provide their services and are
              subject to their own terms and privacy policies.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-2xl text-foreground">
              Security and retention
            </h2>
            <p className="mt-3">
              We use encrypted connections, protected credentials, access
              controls, signed media URLs, and secure server-side processing to
              protect your information. We retain information for as long as
              needed to provide the service, meet legal obligations, resolve
              disputes, and enforce our agreements.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-2xl text-foreground">
              Your choices
            </h2>
            <p className="mt-3">
              You may request access to, correction of, or deletion of your
              personal information. Some records may need to be retained when
              required for legal, security, payment, or audit purposes.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-2xl text-foreground">Contact</h2>
            <p className="mt-3">
              For privacy questions or data requests, contact{" "}
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
