import type { Metadata } from "next"
import Link from "next/link"
import { Mail, MessageCircle } from "lucide-react"

import { PublicShell } from "@/components/public-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressThread } from "@/components/ui/progress-thread"

export const metadata: Metadata = {
  title: "সাপোর্টে যোগাযোগ করুন",
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
          সাপোর্ট · যোগাযোগ
        </p>
        <h1 className="mt-3 max-w-2xl font-heading text-4xl tracking-tight sm:text-5xl">
          চলুন, একসাথে সমস্যার সমাধান করি।
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          পেমেন্ট, এনরোলমেন্ট বা অ্যাকাউন্ট সংক্রান্ত সাহায্যের জন্য অর্ডার রেফারেন্স
          এবং অ্যাকাউন্টে ব্যবহৃত ইমেইল পাঠান।
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card>
            <CardContent>
              <Mail className="size-5 text-primary" />
              <h2 className="mt-5 font-heading text-2xl">ইমেইল সাপোর্ট</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                পেমেন্ট যাচাই ও অ্যাকাউন্ট-সংক্রান্ত প্রশ্নের জন্য উপযুক্ত।
              </p>
              <Button asChild className="mt-6">
                <a href={`mailto:${email}`}>{email}</a>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <MessageCircle className="size-5 text-primary" />
              <h2 className="mt-5 font-heading text-2xl">লেখার আগে</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                আপনার অ্যাকাউন্ট ইমেইল, কোর্সের নাম, অর্ডার রেফারেন্স এবং সমস্যার
                সংক্ষিপ্ত বিবরণ দিন।
              </p>
              <Button asChild className="mt-6" variant="outline">
                <Link href="/faq">সাধারণ জিজ্ঞাসা দেখুন</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicShell>
  )
}
