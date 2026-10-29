import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"

import { ModelTestEntryForm } from "./entry-form"

export const dynamic = "force-dynamic"

export default function StudentModelTestsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী · মডেল টেস্ট"
        lede="টাইমার ও এলোমেলো প্রশ্নসহ পরীক্ষার মতো টেস্ট দিন। কোনো প্রক্টরিং, ওয়েবক্যাম বা ট্যাব নজরদারি নেই।"
        title="মডেল টেস্ট"
      />
      <Card>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            টেস্টে অংশ নিতে শিক্ষকের দেওয়া টেস্ট আইডি দিন। টেস্টটি আপনার
            এনরোল করা কোর্সের হতে হবে।
          </p>
          <ModelTestEntryForm />
          <Button asChild variant="outline">
            <Link href="/dashboard/student/mistake-bank">
              Mistake Bank দেখুন
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
