import type { Metadata } from "next"
import Link from "next/link"
import { Mail, MessageCircle } from "lucide-react"

import { PublicShell } from "@/components/public-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressThread } from "@/components/ui/progress-thread"

export const metadata: Metadata = {
  title: "Contact support",
  description:
    "Contact Folio support about payments, course access and account issues.",
}

export default function ContactPage() {
  const email =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@folio.example.com"

  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <ProgressThread className="mb-8 w-24" />
        <p className="font-mono text-xs text-muted-foreground">
          Support · Contact
        </p>
        <h1 className="mt-3 max-w-2xl font-heading text-4xl tracking-tight sm:text-5xl">
          Let’s solve it together.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          For payment, enrollment or account help, send the relevant order
          reference and the email used on your account.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card>
            <CardContent>
              <Mail className="size-5 text-primary" />
              <h2 className="mt-5 font-heading text-2xl">Email support</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Best for payment verification and account-specific questions.
              </p>
              <Button asChild className="mt-6">
                <a href={`mailto:${email}`}>{email}</a>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <MessageCircle className="size-5 text-primary" />
              <h2 className="mt-5 font-heading text-2xl">Before you write</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Include your account email, course title, order reference and a
                short description of the issue.
              </p>
              <Button asChild className="mt-6" variant="outline">
                <Link href="/faq">Read the FAQ</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicShell>
  )
}
