import type { Metadata } from "next"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { PublicShell } from "@/components/public-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressThread } from "@/components/ui/progress-thread"

export const metadata: Metadata = {
  title: "সাধারণ জিজ্ঞাসা",
  description:
    "Answers about courses, payments, verification and learning on Folio.",
}

const questions = [
  [
    "এনরোলমেন্ট কীভাবে কাজ করে?",
    "প্রকাশিত কোর্স বেছে অর্ডার তৈরি করুন এবং পেমেন্টের নির্দেশনা অনুসরণ করুন। পেমেন্ট সফলভাবে যাচাই হলেই ক্লাসে প্রবেশাধিকার চালু হবে।",
  ],
  [
    "কখন কোর্সে প্রবেশ করতে পারব?",
    "পেমেন্ট যাচাই চলাকালীন পেইড কোর্স খোলা হবে না। সফল যাচাইয়ের পর অর্ডার Paid হবে, এনরোলমেন্ট চালু হবে এবং লার্নিং পেজে যেতে পারবেন।",
  ],
  [
    "কুপন ব্যবহার করতে পারব?",
    "কুপন সক্রিয় থাকলে চেকআউটের সময় সেটি দিন। পেমেন্টের আগে অর্ডারে ছাড়ের পরিমাণ দেখানো হবে।",
  ],
  [
    "কোর্সের ভিডিও কোথায় থাকে?",
    "ভিডিও সময়সীমাবদ্ধ নিরাপদ লিংকের মাধ্যমে দেখানো হয় এবং শিক্ষার্থীর ইমেইল ওয়াটারমার্ক থাকে। PDF ও অন্যান্য উপকরণ নির্ধারিত ফাইল স্টোরেজে থাকে।",
  ],
  [
    "সাপোর্টে কীভাবে যোগাযোগ করব?",
    "যোগাযোগ পেজে আপনার ইমেইল, কোর্সের নাম এবং অর্ডার/রেফারেন্স কোড দিন, তাহলে টিম দ্রুত সহায়তা করতে পারবে।",
  ],
] as const

export default function FaqPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <ProgressThread className="mb-8 w-24" />
        <p className="font-mono text-xs text-muted-foreground">সাপোর্ট · জিজ্ঞাসা</p>
        <h1 className="mt-3 font-heading text-4xl tracking-tight sm:text-5xl">
          শুরু করার আগে জেনে নিন।
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          যাচাইকৃত পেমেন্ট, কোর্স অ্যাক্সেস ও নিরাপদ শেখার সহজ নির্দেশিকা।
        </p>
        <div className="mt-12 grid gap-3">
          {questions.map(([question, answer]) => (
            <Card key={question}>
              <CardContent className="p-0">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 font-heading text-xl [&::-webkit-details-marker]:hidden">
                    {question}
                    <ChevronDown className="size-5 shrink-0 text-primary transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="max-w-3xl px-5 pb-5 text-sm leading-7 text-muted-foreground">
                    {answer}
                  </p>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button asChild className="mt-10" variant="outline">
          <Link href="/contact">আরও সাহায্য দরকার? যোগাযোগ করুন</Link>
        </Button>
      </section>
    </PublicShell>
  )
}
