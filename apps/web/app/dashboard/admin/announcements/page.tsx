import { sendAdminAnnouncementAction } from "@/app/dashboard/admin/actions"
import { PageHeader } from "@workspace/ui/components/page-header"
import { Card, CardContent } from "@workspace/ui/components/card"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import { Textarea } from "@workspace/ui/components/textarea"
import { SubmitButton } from "@/components/submit-button"

export default function AdminAnnouncementsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin dashboard · Communication"
        title="Admin announcements"
        lede="Send a notification to every student, every instructor, or the whole platform."
      />
      <Card className="mt-8 max-w-2xl">
        <CardContent>
          <form action={sendAdminAnnouncementAction} className="grid gap-4">
            <FloatingInput label="Title" name="title" required />
            <label className="grid gap-2 text-sm text-muted-foreground">
              Audience
              <select
                className="h-11 rounded-xl border border-input bg-input/30 px-3 text-foreground scheme-dark [&>option]:bg-card [&>option]:text-foreground"
                name="audience"
                defaultValue="students"
                style={{ colorScheme: "dark" }}
              >
                <option value="students">Students</option>
                <option value="instructors">Instructors</option>
                <option value="all">Everyone</option>
              </select>
            </label>
            <Textarea name="body" placeholder="Announcement message" required />
            <SubmitButton pendingLabel="Sending...">
              Send announcement
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
