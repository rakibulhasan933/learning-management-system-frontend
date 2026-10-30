import Image from "next/image"
import Link from "next/link"
import { BookOpen, PlayCircle } from "lucide-react"
import type { StudentOrderListResponse } from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { formatDate } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function StudentClassesPage() {
  const response = await authenticatedApiFetch<StudentOrderListResponse>(
    "/payments/my-orders"
  )
  const courses = response.orders.filter((order) => order.status === "paid")

  return (
    <div className="student-classes-page">
      <PageHeader
        eyebrow="শিক্ষার্থী ড্যাশবোর্ড · আমার ক্লাস"
        lede="আপনার সক্রিয় কোর্স, উপকরণ এবং শেখার অগ্রগতি এক জায়গায় দেখুন।"
        title="আমার ক্লাস"
      />
      {courses.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            action={
              <Button>
                <Link href="/courses">কোর্স দেখুন</Link>
              </Button>
            }
            description="যাচাই করা এনরোলমেন্ট এখানে দেখা যাবে।"
            icon={<BookOpen />}
            title="এখনও কোনো সক্রিয় ক্লাস নেই"
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course, index) => (
            <Card className="overflow-hidden" key={course.id}>
              <div className="relative aspect-[16/9] bg-card">
                {course.thumbnailUrl ? (
                  <Image
                    alt={course.courseTitle}
                    className="object-cover"
                    fill
                    priority={index === 0}
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    src={course.thumbnailUrl}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-primary/5">
                    <BookOpen className="size-10 text-primary/60" />
                  </div>
                )}
              </div>
              <CardContent className="flex min-h-40 flex-col">
                <p className="font-mono text-xs text-muted-foreground">
                  এনরোল করা হয়েছে {formatDate(course.createdAt)}
                </p>
                <h2 className="mt-2 font-heading text-xl leading-snug">
                  {course.courseTitle}
                </h2>
                <Button className="mt-auto w-full">
                  <Link href={`/learn/${course.courseId}`}>
                    <PlayCircle />
                    শেখা চালিয়ে যান
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
