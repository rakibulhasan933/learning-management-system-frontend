"use client"

import Link from "next/link"
import { MailCheck, Users } from "lucide-react"
import type { UserRole } from "@workspace/types"

import {
  activateUserAction,
  suspendUserAction,
} from "@/app/dashboard/admin/actions"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { EmptyState } from "@workspace/ui/components/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { SubmitButton } from "@/components/submit-button"
import { UserRolePill } from "@/components/status-pill"
import { cn } from "@workspace/ui/lib/utils"

export interface UserRow {
  id: string
  index: number
  initials: string
  email: string
  name: string
  role: UserRole
  provider: string
  verified: boolean
  suspended: boolean
  joined: string
}

interface UsersTableProps {
  rows: UserRow[]
  total: number
  hasFilters: boolean
}

export function UsersTable({ rows, total, hasFilters }: UsersTableProps) {
  if (rows.length === 0) {
    return (
      <Card className="mt-5">
        <CardContent>
          <EmptyState
            action={
              hasFilters ? (
                <Button asChild variant="outline">
                  <Link href="/dashboard/admin/users">Clear filters</Link>
                </Button>
              ) : undefined
            }
            description={
              hasFilters
                ? "No accounts match these filters."
                : "Accounts appear here as people sign up, or once you add an instructor."
            }
            icon={<Users />}
            title={hasFilters ? "No matches" : "No accounts on record yet"}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Compact rows remain available on every viewport. */}
      <div className="mt-5 grid min-w-0 gap-3">
        {rows.map((row) => (
          <article
            className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
            key={row.id}
          >
            <div className="flex items-start justify-between gap-3">
              <AccountIdentity row={row} />
              <UserRolePill role={row.role} />
            </div>
            <dl className="grid gap-1.5 border-t border-border pt-3 text-sm text-muted-foreground">
              <div className="flex justify-between gap-4">
                <dt>Provider</dt>
                <dd className="font-mono text-foreground">{row.provider}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Verification</dt>
                <dd>
                  <Verification verified={row.verified} />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Status</dt>
                <dd>
                  <AccessStatus suspended={row.suspended} />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Joined</dt>
                <dd className="font-mono text-foreground">{row.joined}</dd>
              </div>
            </dl>
            <AccessForm className="grid" fullWidth row={row} />
          </article>
        ))}
      </div>

      {/* Wide table view. */}
      <div className="hidden">
        <Table className="min-w-[920px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">№</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-muted-foreground tabular-nums">
                  {row.index}
                </TableCell>
                <TableCell>
                  <AccountIdentity row={row} />
                </TableCell>
                <TableCell>
                  <UserRolePill role={row.role} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.provider}
                </TableCell>
                <TableCell>
                  <Verification verified={row.verified} />
                </TableCell>
                <TableCell>
                  <AccessStatus suspended={row.suspended} />
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {row.joined}
                </TableCell>
                <TableCell className="text-right">
                  <AccessForm className="inline" row={row} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="mt-4 text-right font-mono text-xs text-muted-foreground">
        {total} account{total === 1 ? "" : "s"} on record
      </p>
    </>
  )
}

function AccountIdentity({ row }: { row: UserRow }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background font-mono text-xs text-primary ring-1 ring-border md:size-8">
        {row.initials}
      </span>
      <div className="min-w-0">
        <div className="truncate font-mono text-sm text-foreground">
          {row.email}
        </div>
        <div className="truncate text-sm text-muted-foreground">{row.name}</div>
      </div>
    </div>
  )
}

function Verification({ verified }: { verified: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <MailCheck
        className={
          verified
            ? "size-3.5 text-secondary"
            : "size-3.5 text-muted-foreground/50"
        }
      />
      {verified ? "Verified" : "Unverified"}
    </span>
  )
}

function AccessStatus({ suspended }: { suspended: boolean }) {
  return (
    <span
      className={
        suspended
          ? "inline-flex items-center gap-1.5 text-destructive"
          : "inline-flex items-center gap-1.5 text-secondary"
      }
    >
      <span
        className={`size-1.5 rounded-full ${
          suspended ? "bg-destructive" : "bg-secondary"
        }`}
      />
      {suspended ? "Suspended" : "Active"}
    </span>
  )
}

function AccessForm({
  className,
  fullWidth,
  row,
}: {
  className?: string
  fullWidth?: boolean
  row: UserRow
}) {
  const verb = row.suspended ? "Reinstate" : "Suspend"

  return (
    <form
      action={row.suspended ? activateUserAction : suspendUserAction}
      className={className}
    >
      <input name="userId" type="hidden" value={row.id} />
      <SubmitButton
        className={cn(
          fullWidth && "w-full",
          row.suspended && "border-primary/60 text-primary"
        )}
        pendingLabel={row.suspended ? "Reinstating..." : "Suspending..."}
        size={fullWidth ? "default" : "sm"}
        variant={row.suspended ? "outline" : "destructive"}
      >
        {fullWidth ? `${verb} access` : verb}
      </SubmitButton>
    </form>
  )
}
