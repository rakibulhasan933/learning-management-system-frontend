import type { InstructorAnalyticsOverviewResponse } from "@/lib/types"

import { createInstructorAnnouncementAction } from "@/app/dashboard/instructor/actions"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { PageHeader } from "@/components/ui/page-header"
import { Textarea } from "@/components/ui/textarea"

export const dynamic = "force-dynamic"

export default async function InstructorAnnouncementsPage() {
  const overview =
    await authenticatedApiFetch<InstructorAnalyticsOverviewResponse>(
      "/instructor/overview",
      { cache: "no-store" }
    )
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Instructor dashboard"
        lede="Send a message to all active students in a course."
        title="Student announcements"
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {overview.courses.map((course) => (
          <Card key={course.id}>
            <CardContent>
              <p className="font-mono text-xs text-muted-foreground">
                {course.status}
              </p>
              <h2 className="mt-2 font-heading text-2xl">{course.title}</h2>
              <form
                action={createInstructorAnnouncementAction}
                className="mt-5 grid gap-4 border-t border-border pt-5"
              >
                <input name="courseId" type="hidden" value={course.id} />
                <FloatingInput
                  label="Announcement title"
                  name="title"
                  required
                />
                <Textarea
                  aria-label="Announcement message"
                  name="body"
                  placeholder="Write an update for your students..."
                  required
                />
                <Button type="submit">Send announcement</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
