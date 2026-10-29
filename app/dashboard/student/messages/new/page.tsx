import { PageHeader } from "@/components/ui/page-header"

import { ComposeMessageForm } from "../compose-message-form"

export const dynamic = "force-dynamic"

export default async function NewStudentMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; title?: string }>
}) {
  const { courseId, title } = await searchParams

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী ড্যাশবোর্ড"
        lede="কোর্সের শিক্ষকের সাথে নতুন কথোপকথন শুরু করুন।"
        title="শিক্ষককে মেসেজ করুন"
      />
      {courseId ? (
        <ComposeMessageForm courseId={courseId} courseTitle={title ?? null} />
      ) : (
        <p className="rounded-xl border border-border bg-card/40 p-6 text-sm text-muted-foreground">
          কোন কোর্সের জন্য মেসেজ পাঠাবেন তা নির্ধারণ করা যায়নি। অনুগ্রহ করে
          কোর্স পেজ থেকে আবার চেষ্টা করুন।
        </p>
      )}
    </div>
  )
}
