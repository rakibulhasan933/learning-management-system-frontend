import type {
  DiscussionListResponse,
  InstructorAnalyticsOverviewResponse,
} from "@workspace/types"

import { createInstructorDiscussionReplyAction } from "@/app/dashboard/instructor/actions"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { PageHeader } from "@workspace/ui/components/page-header"
import { Textarea } from "@workspace/ui/components/textarea"

export const dynamic = "force-dynamic"

export default async function InstructorDiscussionsPage() {
  const overview =
    await authenticatedApiFetch<InstructorAnalyticsOverviewResponse>(
      "/instructor/overview",
      { cache: "no-store" }
    )
  const discussions = await Promise.all(
    overview.courses.map(async (course) => ({
      course,
      response: await authenticatedApiFetch<DiscussionListResponse>(
        `/instructor/courses/${course.id}/discussions`,
        { cache: "no-store" }
      ),
    }))
  )
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Instructor dashboard"
        lede="Answer questions and continue the conversation around your courses."
        title="Course discussions"
      />
      <div className="grid gap-5">
        {discussions.map(({ course, response }) => (
          <Card key={course.id}>
            <CardContent>
              <h2 className="font-heading text-2xl">{course.title}</h2>
              <div className="mt-5 grid gap-3">
                {response.posts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No discussion posts yet.
                  </p>
                ) : (
                  response.posts.map((post) => (
                    <div
                      className="rounded-xl border border-border p-4"
                      key={post.id}
                    >
                      <p className="text-sm leading-6">{post.body}</p>
                      <p className="mt-2 font-mono text-xs text-muted-foreground">
                        {post.authorName ?? post.authorRole} ·{" "}
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                      <form
                        action={createInstructorDiscussionReplyAction}
                        className="mt-3 flex gap-2"
                      >
                        <input
                          name="courseId"
                          type="hidden"
                          value={course.id}
                        />
                        <input name="parentId" type="hidden" value={post.id} />
                        <Textarea
                          className="min-h-10"
                          name="body"
                          placeholder="Reply to this student..."
                          required
                        />
                        <Button size="sm" type="submit">
                          Reply
                        </Button>
                      </form>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
