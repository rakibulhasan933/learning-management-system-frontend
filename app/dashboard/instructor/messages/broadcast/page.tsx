import type {
  BatchListResponse,
  InstructorCourseListResponse,
} from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/ui/page-header"

import { BroadcastForm } from "./broadcast-form"

export const dynamic = "force-dynamic"

export default async function InstructorBroadcastPage() {
  const [coursesResponse, batchesResponse] = await Promise.all([
    authenticatedApiFetch<InstructorCourseListResponse>("/instructor/courses", {
      cache: "no-store",
    }),
    authenticatedApiFetch<BatchListResponse>("/instructor/batches", {
      cache: "no-store",
    }),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="শিক্ষক ড্যাশবোর্ড"
        lede="একটি কোর্স বা ব্যাচের সব শিক্ষার্থীকে একসাথে মেসেজ পাঠান। প্রত্যেকের জন্য আলাদা কথোপকথন তৈরি হয়।"
        title="সবাইকে মেসেজ পাঠান"
      />
      <BroadcastForm
        batches={batchesResponse.batches}
        courses={coursesResponse.courses}
      />
    </div>
  )
}
