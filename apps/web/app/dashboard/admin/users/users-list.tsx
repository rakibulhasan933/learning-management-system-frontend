"use client"

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react"
import { ListFilter, Mail, ShieldCheck, UserPlus, Users, X } from "lucide-react"
import type { AdminUserListResponse } from "@workspace/types"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { StatTile } from "@workspace/ui/components/stat-tile"
import { formatDate } from "@/lib/format"

import { UsersTable, type UserRow } from "./users-table"

function initials(name: string | null, email: string) {
  const source = name?.trim() || email
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?"
}

function toRows(response: AdminUserListResponse): UserRow[] {
  return response.users.map((user, index) => ({
    id: user.id,
    index: index + 1,
    initials: initials(user.fullName, user.email),
    email: user.email,
    name: user.fullName ?? "No name on file",
    role: user.role,
    provider: user.authProvider,
    verified: Boolean(user.emailVerifiedAt),
    suspended: Boolean(user.suspendedAt),
    joined: formatDate(user.createdAt),
  }))
}

export function UsersList({
  initialResponse,
}: {
  initialResponse: AdminUserListResponse
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [response, setResponse] = useState<AdminUserListResponse>(initialResponse)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState(searchParams.get("role") ?? "all")
  const [status, setStatus] = useState(searchParams.get("status") ?? "all")
  const queryString = searchParams.toString()

  useEffect(() => {
    const controller = new AbortController()

    async function loadUsers() {
      setError(null)

      try {
        const result = await fetch(`/api/admin/users${queryString ? `?${queryString}` : ""}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        const payload = (await result.json()) as AdminUserListResponse & { message?: string }

        if (!result.ok) throw new Error(payload.message ?? "Unable to load users.")
        setResponse(payload)
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load users.")
        }
      }
    }

    void loadUsers()
    return () => controller.abort()
  }, [queryString])

  const rows = useMemo(() => (response ? toRows(response) : []), [response])
  const total = response?.users.length ?? 0
  const hasFilters = Boolean(
    searchParams.get("q") || searchParams.get("role") || searchParams.get("status"),
  )

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    const q = String(formData.get("q") ?? "").trim()
    if (q) next.set("q", q)
    if (role !== "all") next.set("role", role)
    if (status !== "all") next.set("status", status)

    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`))
  }

  function clearFilters() {
    setRole("all")
    setStatus("all")
    startTransition(() => router.replace(pathname))
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={<Users />} label="Accounts" value={total} />
        <StatTile icon={<ShieldCheck />} label="Active" value={response?.users.filter((user) => !user.suspendedAt).length ?? 0} />
        <StatTile icon={<Mail />} label="Suspended" value={response?.users.filter((user) => user.suspendedAt).length ?? 0} />
        <StatTile icon={<UserPlus />} label="Instructors" value={response?.users.filter((user) => user.role === "instructor").length ?? 0} />
      </div>

      <Card className="mt-6 min-w-0 border-primary/15 bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ListFilter className="size-4" />
            </span>
            <div>
              <h2 className="font-heading text-xl tracking-tight">Search &amp; filter</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Narrow the account ledger by name, role, or access status.
              </p>
            </div>
          </div>
          {hasFilters ? (
            <Button className="w-full sm:w-auto" onClick={clearFilters} size="sm" type="button" variant="ghost">
              <X className="size-3.5" />
              Clear filters
            </Button>
          ) : null}
        </div>
        <CardContent className="p-5">
          <form onSubmit={applyFilters}>
            <div className="mt-5 grid min-w-0 items-end gap-3 border-t border-border pt-5 sm:grid-cols-[minmax(0,1fr)_minmax(130px,150px)] lg:grid-cols-[minmax(0,1fr)_minmax(130px,150px)_minmax(140px,150px)_auto]">
              <div className="min-w-0">
                <label className="mb-1.5 block text-xs text-muted-foreground" htmlFor="user-search">Search accounts</label>
                <FloatingInput defaultValue={searchParams.get("q") ?? ""} id="user-search" label="Email or name" name="q" />
              </div>
              <label className="grid gap-1.5 text-xs text-muted-foreground">
                Role
                <select
                  aria-label="Filter by role"
                  className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm text-foreground [color-scheme:dark] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  onChange={(event) => setRole(event.target.value)}
                  value={role}
                >
                  <option className="bg-card text-foreground" value="all">All roles</option>
                  <option className="bg-card text-foreground" value="admin">Admin</option>
                  <option className="bg-card text-foreground" value="instructor">Instructor</option>
                  <option className="bg-card text-foreground" value="student">Student</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-xs text-muted-foreground">
                Status
                <select
                  aria-label="Filter by status"
                  className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm text-foreground [color-scheme:dark] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  onChange={(event) => setStatus(event.target.value)}
                  value={status}
                >
                  <option className="bg-card text-foreground" value="all">All statuses</option>
                  <option className="bg-card text-foreground" value="active">Active</option>
                  <option className="bg-card text-foreground" value="suspended">Suspended</option>
                </select>
              </label>
              <Button className="w-full sm:w-auto" disabled={isPending} type="submit" variant="outline">{isPending ? "Loading..." : "Apply"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Card className="mt-5"><CardContent><p className="text-sm text-destructive">{error}</p></CardContent></Card>
      ) : response ? (
        <UsersTable hasFilters={hasFilters} rows={rows} total={total} />
      ) : (
        <Card className="mt-5"><CardContent className="grid gap-3 py-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </CardContent></Card>
      )}
    </>
  )
}
