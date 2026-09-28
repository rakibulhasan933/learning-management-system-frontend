import Link from "next/link"
import { ArrowLeft, UserPlus } from "lucide-react"
import type { AdminUserListResponse } from "@workspace/types"

import { createInstructorAction } from "@/app/dashboard/admin/actions"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@workspace/ui/components/card"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import { PageHeader } from "@workspace/ui/components/page-header"
import { Button } from "@workspace/ui/components/button"
import { SubmitButton } from "@/components/submit-button"
import { UsersList } from "./users-list"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const initialResponse = await authenticatedApiFetch<AdminUserListResponse>(
    "/admin/users",
    { cache: "no-store" }
  )

  return (
    <>
      <PageHeader
        action={
          <Button className="w-full sm:w-auto" variant="outline" asChild>
            <Link href="/dashboard/admin">
              <ArrowLeft className="size-3.5" />
              Dashboard
            </Link>
          </Button>
        }
        eyebrow="Admin dashboard · User ledger"
        lede="Every account on record, with the role and status it holds today. Suspend or reinstate access, or add a new instructor below."
        size="compact"
        title="User accounts"
      />

      <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <UsersList initialResponse={initialResponse} />

        <Card>
          <CardContent>
            <form action={createInstructorAction}>
              <p className="font-mono text-xs tracking-wide text-muted-foreground">
                New account
              </p>
              <h2 className="mt-2 flex items-center gap-2 font-heading text-2xl tracking-tight">
                <UserPlus className="size-4 text-primary" />
                Add an instructor
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This account is verified immediately and can sign in with the
                password you set here.
              </p>
              <div className="mt-5 grid gap-4 border-t border-border pt-5">
                <FloatingInput label="Full name" name="fullName" />
                <FloatingInput
                  autoComplete="email"
                  label="Email address"
                  name="email"
                  required
                  type="email"
                />
                <FloatingInput
                  autoComplete="new-password"
                  label="Temporary password"
                  minLength={8}
                  name="password"
                  required
                  type="password"
                />
                <SubmitButton pendingLabel="Creating...">
                  Create instructor
                </SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
