import type { DiscussionListResponse } from "@/lib/types"
import { MessageCircle } from "lucide-react"

import { createDiscussionPostAction } from "./discussion-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export function DiscussionPanel({
  courseId,
  discussion,
}: {
  courseId: string
  discussion: DiscussionListResponse
}) {
  return (
    <Card className="mt-8">
      <CardContent>
        <div className="flex items-center gap-3">
          <MessageCircle className="size-5 text-primary" />
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              Course discussion
            </p>
            <h2 className="font-heading text-2xl">Ask and learn together</h2>
          </div>
        </div>
        <form
          action={createDiscussionPostAction}
          className="mt-5 grid gap-3 border-t border-border pt-5"
        >
          <input name="courseId" type="hidden" value={courseId} />
          <Textarea
            name="body"
            placeholder="Ask a question about this course..."
            required
          />
          <Button className="w-fit" type="submit">
            Post question
          </Button>
        </form>
        <div className="mt-6 grid gap-3">
          {discussion.posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No questions yet. Start the discussion.
            </p>
          ) : (
            discussion.posts.map((post) => (
              <div
                className="rounded-xl border border-border p-4"
                key={post.id}
              >
                <p className="text-sm leading-6">{post.body}</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {post.authorName ?? post.authorRole} ·{" "}
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
