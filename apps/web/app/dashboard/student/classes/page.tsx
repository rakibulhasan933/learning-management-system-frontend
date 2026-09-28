import Image from "next/image"
import Link from "next/link"
import { BookOpen, PlayCircle } from "lucide-react"
import type { StudentOrderListResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { PageHeader } from "@workspace/ui/components/page-header"
import { formatDate } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function StudentClassesPage() {
  const response = await authenticatedApiFetch<StudentOrderListResponse>(
    "/payments/my-orders"
  )
  const courses = response.orders.filter((order) => order.status === "paid")

  return (
    <>
      <PageHeader
        eyebrow="Student dashboard · My classes"
        lede="All your active courses, course materials, and learning progress in one place."
        title="My classes"
      />
      {courses.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            action={
              <Button asChild>
                <Link href="/courses">Browse courses</Link>
              </Button>
            }
            description="Verified enrollments will appear here."
            icon={<BookOpen />}
            title="No active classes yet"
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Card className="overflow-hidden" key={course.id}>
              <div className="relative aspect-[16/9] bg-card">
                {course.thumbnailUrl ? (
                  <Image
                    alt={course.courseTitle}
                    className="object-cover"
                    fill
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
                  Enrolled {formatDate(course.createdAt)}
                </p>
                <h2 className="mt-2 font-heading text-xl leading-snug">
                  {course.courseTitle}
                </h2>
                <Button asChild className="mt-auto w-full">
                  <Link href={`/learn/${course.courseId}`}>
                    <PlayCircle />
                    Continue learning
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
