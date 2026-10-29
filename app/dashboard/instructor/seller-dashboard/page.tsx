import type {
  InstructorCourseListResponse,
  SellerDashboardResponse,
} from "@/lib/types"
import { ApiClientError, authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { StatTile } from "@/components/ui/stat-tile"
import { formatCurrency, formatDateTime } from "@/lib/format"

import {
  AnnouncementDraftForm,
  SellerExportButton,
} from "./seller-dashboard-client"

export const dynamic = "force-dynamic"

export default async function SellerDashboardPage() {
  let data: SellerDashboardResponse | null = null
  let loadError: string | null = null
  try {
    data = await authenticatedApiFetch<SellerDashboardResponse>(
      "/instructor/seller-dashboard",
      { cache: "no-store" }
    )
  } catch (error) {
    loadError =
      error instanceof ApiClientError
        ? error.message
        : "Seller dashboard could not be loaded."
  }

  let courses: InstructorCourseListResponse["courses"] = []
  try {
    const response =
      await authenticatedApiFetch<InstructorCourseListResponse>(
        "/instructor/courses",
        { cache: "no-store" }
      )
    courses = response.courses
  } catch {
    courses = []
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ইন্সট্রাক্টর · বিক্রি"
        lede="শুধুমাত্র আপনার নিজের কোর্সের বিক্রি, শেখা ও ঝুঁকিপূর্ণ শিক্ষার্থীর তথ্য। অন্য শিক্ষকের তথ্য এখানে দেখানো হয় না।"
        title="সেলার ড্যাশবোর্ড"
      />
      {loadError || !data ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError ?? "Seller dashboard could not be loaded."}
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="মোট বিক্রি (paid অর্ডারের যোগফল)"
              value={formatCurrency(data.sales.total)}
            />
            <StatTile
              label="Paid অর্ডার"
              value={String(data.sales.paid)}
            />
            <StatTile
              label="Pending / প্রত্যাখ্যাত"
              value={`${data.sales.pending} / ${data.sales.rejected}`}
            />
            <StatTile
              label="উত্তোলনযোগ্য ব্যালেন্স"
              value={formatCurrency(data.payoutBalance.availableBalance)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            সংরক্ষিত অর্থ: {formatCurrency(data.payoutBalance.reservedAmount)} ·
            মোট আয়: {formatCurrency(data.payoutBalance.totalRevenue)} ·
            মুলতুবি পেআউট অনুরোধ:{" "}
            {data.payoutBalance.pendingPayoutRequestCount}টি · মোট রিফান্ড:{" "}
            {formatCurrency(data.refundTotal)}
          </p>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-2">
                <h2 className="font-heading text-xl">পেমেন্ট মাধ্যম অনুযায়ী</h2>
                {data.ordersByPaymentMethod.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    এখনও কোনো অর্ডার নেই।
                  </p>
                ) : (
                  data.ordersByPaymentMethod.map((row) => (
                    <p className="text-sm" key={row.paymentMethod}>
                      {row.paymentMethod}: {row.count}টি ·{" "}
                      {formatCurrency(row.total)}
                    </p>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2">
                <h2 className="font-heading text-xl">কুপন পারফরম্যান্স</h2>
                {data.couponPerformance.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    কোনো কুপন ব্যবহার হয়নি।
                  </p>
                ) : (
                  data.couponPerformance.map((row) => (
                    <p className="text-sm" key={row.couponCode}>
                      {row.couponCode}: {row.uses} বার · ছাড়{" "}
                      {formatCurrency(row.discountGiven)} · আয়{" "}
                      {formatCurrency(row.revenue)}
                    </p>
                  ))
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardContent className="space-y-2">
                <h2 className="font-heading text-xl">কোর্সপ্রতি এনরোলমেন্ট</h2>
                {data.enrolmentsPerCourse.map((row) => (
                  <p className="text-sm" key={row.courseId}>
                    {row.courseTitle}: {row.enrolments}টি (সক্রিয়{" "}
                    {row.activeEnrolments}টি)
                  </p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2">
                <h2 className="font-heading text-xl">কোর্সপ্রতি সম্পন্নের হার</h2>
                {data.completionPerCourse.map((row) => (
                  <p className="text-sm" key={row.courseId}>
                    {row.courseTitle}: {row.completionRate}% (
                    {row.completedEnrolments} জন সম্পন্ন)
                  </p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2">
                <h2 className="font-heading text-xl">ড্রপ-অফ</h2>
                <p className="text-xs leading-5 text-muted-foreground">
                  সংজ্ঞা: প্রথম লেকচার যার সম্পন্নের হার আগের লেকচারের চেয়ে
                  কমপক্ষে ২০ পয়েন্ট কম।
                </p>
                {data.dropOffPerCourse.map((row) => (
                  <p className="text-sm" key={row.courseId}>
                    {row.courseTitle}:{" "}
                    {row.dropOffLesson
                      ? `${row.dropOffLesson.lectureTitle} (${row.dropOffLesson.rateBefore}% → ${row.dropOffLesson.rateAfter}%)`
                      : "কোনো ড্রপ-অফ ধরা পড়েনি"}
                  </p>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-2">
                <h2 className="font-heading text-xl">
                  দুর্বলতা — কুইজভিত্তিক (per-quiz)
                </h2>
                <p className="text-xs leading-5 text-muted-foreground">
                  {data.topicWeakness.note} এটি ট্যাগযুক্ত টপিক-দুর্বলতা নয়;
                  পুরনো কুইজ প্রশ্নে টপিক ট্যাগ থাকে না।
                </p>
                {data.topicWeakness.quizzes.map((quiz) => (
                  <p className="text-sm" key={quiz.quizId}>
                    {quiz.quizTitle} ({quiz.courseTitle}): গড়{" "}
                    {quiz.averagePercentage}% · {quiz.attempts}টি চেষ্টা
                  </p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2">
                <h2 className="font-heading text-xl">ঝুঁকিপূর্ণ শিক্ষার্থী</h2>
                <p className="text-xs leading-5 text-muted-foreground">
                  সংজ্ঞা: সক্রিয় এনরোলমেন্ট, কোর্স সম্পন্ন নয়, ১৪ দিন কোনো
                  অ্যাক্টিভিটি নেই।
                </p>
                {data.atRiskStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    কোনো ঝুঁকিপূর্ণ শিক্ষার্থী নেই।
                  </p>
                ) : (
                  data.atRiskStudents.map((student) => (
                    <p className="text-sm" key={`${student.userId}-${student.courseId}`}>
                      {student.studentName ?? student.studentEmail} ·{" "}
                      {student.courseTitle} · শেষ অ্যাক্টিভিটি{" "}
                      {formatDateTime(student.lastActivityAt)}
                    </p>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-heading text-xl">বাল্ক এক্সপোর্ট</h2>
            <p className="text-sm text-muted-foreground">
              আপনার নিজের কোর্সের শিক্ষার্থীদের তালিকা CSV হিসেবে ডাউনলোড
              করুন।
            </p>
            <SellerExportButton />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="font-heading text-xl">
              বাল্ক ঘোষণা — খসড়া মাত্র
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              এই ফর্ম কিছু পাঠায় না। শুধু খসড়া ও প্রাপকের প্রিভিউ তৈরি হয়।
            </p>
            <div className="mt-4">
              <AnnouncementDraftForm courses={courses} />
            </div>
          </CardContent>
        </Card>
      </section>
      {courses.length === 0 && !loadError ? (
        <EmptyState
          description="Create a course first to use the seller dashboard bulk tools."
          title="এখনও কোনো কোর্স নেই"
        />
      ) : null}
    </div>
  )
}
