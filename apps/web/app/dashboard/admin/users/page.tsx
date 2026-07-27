import Link from "next/link"
import {
  ArrowLeft,
  Mail,
  MailCheck,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react"
import type {
  AdminUserListResponse,
  UserRole,
} from "@workspace/types"

import {
  activateUserAction,
  createInstructorAction,
  suspendUserAction,
} from "@/app/dashboard/admin/actions"
import { authenticatedApiFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

interface AdminUsersPageProps {
  searchParams: Promise<{
    q?: string
    role?: UserRole
    status?: "active" | "suspended"
  }>
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  instructor: "Instructor",
  student: "Student",
}

function initials(name: string | null, email: string) {
  const source = name?.trim() || email
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  const chars = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "")
  return chars.join("") || "?"
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const query = await searchParams
  const params = new URLSearchParams()

  if (query.q) params.set("q", query.q)
  if (query.role) params.set("role", query.role)
  if (query.status) params.set("status", query.status)

  const response = await authenticatedApiFetch<AdminUserListResponse>(
    `/admin/users${params.size ? `?${params.toString()}` : ""}`,
    { cache: "no-store" },
  );

  console.log({response})

  const total = response.users.length
  const active = response.users.filter((u) => !u.suspendedAt).length
  const suspended = total - active
  const instructors = response.users.filter(
    (u) => u.role === "instructor",
  ).length

  const stats = [
    { label: "Accounts", value: total, icon: Users },
    { label: "Active", value: active, icon: ShieldCheck },
    { label: "Suspended", value: suspended, icon: Mail },
    { label: "Instructors", value: instructors, icon: UserPlus },
  ]

  const hasFilters = Boolean(query.q || query.role || query.status)

  return (
    <main className="min-h-screen bg-[#0B0D0F] px-4 py-10 text-[#EDEEF0] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-6xl">
        {/* Masthead */}
        <div className="flex flex-col gap-6 border-b border-[#22262B] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#C9A24B]">
              Admin dashboard · User ledger
            </p>
            <h1 className="mt-3 text-3xl font-medium tracking-tight text-[#EDEEF0] sm:text-4xl">
              User accounts
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#8B929B]">
              Every account on record, with the role and status it holds
              today. Suspend or reinstate access, or add a new instructor
              below.
            </p>
          </div>
          <Link
            className="inline-flex w-fit items-center gap-2 border border-[#22262B] px-4 py-2 text-sm text-[#EDEEF0] transition-colors hover:border-[#C9A24B]/60 hover:text-[#C9A24B]"
            href="/dashboard/admin"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>

        {/* Stat strip */}
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden border border-[#22262B] bg-[#22262B] sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div className="bg-[#0E1013] px-5 py-4" key={label}>
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[#8B929B]">
                <Icon className="h-3 w-3" />
                {label}
              </dt>
              <dd className="mt-1.5 font-mono text-2xl text-[#EDEEF0]">
                {String(value).padStart(2, "0")}
              </dd>
            </div>
          ))}
        </dl>

        {/* Create instructor + filters */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <form className="border border-[#22262B] bg-[#131619] p-5">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#C9A24B]" />
              <h2 className="text-base text-[#EDEEF0]">Add an instructor</h2>
            </div>
            <p className="mb-4 text-sm leading-6 text-[#8B929B]">
              This account is verified immediately and can sign in with the
              password you set here.
            </p>
            <div className="grid gap-3">
              <input
                className="border border-[#22262B] bg-[#0E1013] px-3 py-2 text-sm text-[#EDEEF0] outline-none placeholder:text-[#8B929B] focus:border-[#C9A24B]/60"
                name="fullName"
                placeholder="Full name"
              />
              <input
                autoComplete="email"
                className="border border-[#22262B] bg-[#0E1013] px-3 py-2 text-sm text-[#EDEEF0] outline-none placeholder:text-[#8B929B] focus:border-[#C9A24B]/60"
                name="email"
                placeholder="Email address"
                required
                type="email"
              />
              <input
                autoComplete="new-password"
                className="border border-[#22262B] bg-[#0E1013] px-3 py-2 text-sm text-[#EDEEF0] outline-none placeholder:text-[#8B929B] focus:border-[#C9A24B]/60"
                minLength={8}
                name="password"
                placeholder="Temporary password"
                required
                type="password"
              />
              <button
                className="mt-1 bg-[#C9A24B] px-4 py-2 text-sm font-medium text-[#14110A] transition-opacity hover:opacity-90"
                formAction={createInstructorAction}
                type="submit"
              >
                Create instructor
              </button>
            </div>
          </form>

          <form className="border border-[#22262B] bg-[#131619] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-[#C9A24B]" />
              <h2 className="text-base text-[#EDEEF0]">Search & filter</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_150px_150px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B929B]" />
                <input
                  className="w-full border border-[#22262B] bg-[#0E1013] py-2 pl-9 pr-3 text-sm text-[#EDEEF0] outline-none placeholder:text-[#8B929B] focus:border-[#C9A24B]/60"
                  defaultValue={query.q ?? ""}
                  name="q"
                  placeholder="Search email or name"
                />
              </div>
              <select
                className="border border-[#22262B] bg-[#0E1013] px-3 py-2 text-sm text-[#EDEEF0] outline-none focus:border-[#C9A24B]/60"
                defaultValue={query.role ?? ""}
                name="role"
              >
                <option value="">All roles</option>
                <option value="admin">Admin</option>
                <option value="instructor">Instructor</option>
                <option value="student">Student</option>
              </select>
              <select
                className="border border-[#22262B] bg-[#0E1013] px-3 py-2 text-sm text-[#EDEEF0] outline-none focus:border-[#C9A24B]/60"
                defaultValue={query.status ?? ""}
                name="status"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <button
                className="border border-[#C9A24B]/60 px-4 py-2 text-sm text-[#C9A24B] transition-colors hover:bg-[#C9A24B]/10"
                type="submit"
              >
                Apply
              </button>
            </div>
            {hasFilters && (
              <Link
                className="mt-3 inline-block text-xs text-[#8B929B] underline decoration-[#22262B] underline-offset-4 hover:text-[#C9A24B]"
                href="/dashboard/admin/users"
              >
                Clear filters
              </Link>
            )}
          </form>
        </div>

        {/* Mobile: card list */}
        <div className="mt-8 border border-[#22262B] bg-[#131619] md:hidden">
          {response.users.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            <div className="grid gap-px bg-[#22262B]">
              {response.users.map((user) => (
                <article className="grid gap-3 bg-[#131619] p-4" key={user.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#22262B] bg-[#0E1013] font-mono text-xs text-[#C9A24B]">
                        {initials(user.fullName, user.email)}
                      </span>
                      <div>
                        <p className="font-mono text-sm text-[#EDEEF0]">
                          {user.email}
                        </p>
                        <p className="mt-0.5 text-sm text-[#8B929B]">
                          {user.fullName ?? "No name on file"}
                        </p>
                      </div>
                    </div>
                    <RoleBadge role={user.role} />
                  </div>
                  <dl className="grid gap-1.5 border-t border-[#22262B] pt-3 text-sm text-[#8B929B]">
                    <div className="flex justify-between gap-4">
                      <dt>Provider</dt>
                      <dd className="font-mono text-[#EDEEF0]">
                        {user.authProvider}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Email</dt>
                      <dd className="font-mono text-[#EDEEF0]">
                        {user.emailVerifiedAt ? "Verified" : "Unverified"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Status</dt>
                      <dd>
                        <StatusBadge suspended={Boolean(user.suspendedAt)} />
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Joined</dt>
                      <dd className="font-mono text-[#EDEEF0]">
                        {formatDate(user.createdAt)}
                      </dd>
                    </div>
                  </dl>
                  <form
                    action={
                      user.suspendedAt ? activateUserAction : suspendUserAction
                    }
                  >
                    <input name="userId" type="hidden" value={user.id} />
                    <button
                      className={
                        user.suspendedAt
                          ? "w-full border border-[#C9A24B]/60 px-3 py-2 text-sm text-[#C9A24B]"
                          : "w-full border border-[#E5484D]/50 px-3 py-2 text-sm text-[#E5484D]"
                      }
                      type="submit"
                    >
                      {user.suspendedAt ? "Reinstate access" : "Suspend access"}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: ledger table */}
        <div className="mt-8 hidden overflow-x-auto border border-[#22262B] bg-[#131619] md:block">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#22262B] text-left text-xs uppercase tracking-wide text-[#8B929B]">
                <th className="w-12 px-4 py-3 font-normal">№</th>
                <th className="px-4 py-3 font-normal">Account</th>
                <th className="px-4 py-3 font-normal">Role</th>
                <th className="px-4 py-3 font-normal">Provider</th>
                <th className="px-4 py-3 font-normal">Verification</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">Joined</th>
                <th className="px-4 py-3 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {response.users.length === 0 ? (
                <tr>
                  <td className="px-4 py-10" colSpan={8}>
                    <EmptyState hasFilters={hasFilters} />
                  </td>
                </tr>
              ) : (
                response.users.map((user, index) => (
                  <tr
                    className="group border-b border-[#22262B] transition-colors last:border-b-0 hover:bg-[#0E1013]"
                    key={user.id}
                  >
                    <td className="border-l-2 border-transparent px-4 py-3 font-mono text-[#8B929B] group-hover:border-[#C9A24B]">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#22262B] bg-[#0E1013] font-mono text-[11px] text-[#C9A24B]">
                          {initials(user.fullName, user.email)}
                        </span>
                        <div>
                          <div className="font-mono text-[#EDEEF0]">
                            {user.email}
                          </div>
                          <div className="text-[#8B929B]">
                            {user.fullName ?? "No name on file"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3 text-[#8B929B]">
                      {user.authProvider}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[#8B929B]">
                        <MailCheck
                          className={
                            user.emailVerifiedAt
                              ? "h-3.5 w-3.5 text-[#4FAE7C]"
                              : "h-3.5 w-3.5 text-[#8B929B]/50"
                          }
                        />
                        {user.emailVerifiedAt ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge suspended={Boolean(user.suspendedAt)} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[#8B929B]">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form
                        action={
                          user.suspendedAt
                            ? activateUserAction
                            : suspendUserAction
                        }
                        className="inline"
                      >
                        <input name="userId" type="hidden" value={user.id} />
                        <button
                          className={
                            user.suspendedAt
                              ? "border border-[#C9A24B]/60 px-3 py-1.5 text-xs text-[#C9A24B] transition-colors hover:bg-[#C9A24B]/10"
                              : "border border-[#E5484D]/50 px-3 py-1.5 text-xs text-[#E5484D] transition-colors hover:bg-[#E5484D]/10"
                          }
                          type="submit"
                        >
                          {user.suspendedAt ? "Reinstate" : "Suspend"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-right font-mono text-xs text-[#8B929B]">
          {total} account{total === 1 ? "" : "s"} on record
        </p>
      </section>
    </main>
  )
}

function RoleBadge({ role }: { role: UserRole }) {
  const dotColor =
    role === "admin"
      ? "bg-[#C9A24B]"
      : role === "instructor"
        ? "bg-[#6C9BFF]"
        : "bg-[#8B929B]"

  return (
    <span className="inline-flex items-center gap-1.5 border border-[#22262B] px-2 py-1 font-mono text-[11px] text-[#EDEEF0]">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {ROLE_LABEL[role]}
    </span>
  )
}

function StatusBadge({ suspended }: { suspended: boolean }) {
  return (
    <span
      className={
        suspended
          ? "inline-flex items-center gap-1.5 text-[#E5484D]"
          : "inline-flex items-center gap-1.5 text-[#4FAE7C]"
      }
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          suspended ? "bg-[#E5484D]" : "bg-[#4FAE7C]"
        }`}
      />
      {suspended ? "Suspended" : "Active"}
    </span>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <Users className="h-5 w-5 text-[#8B929B]" />
      <p className="text-sm text-[#EDEEF0]">
        {hasFilters
          ? "No accounts match these filters."
          : "No accounts on record yet."}
      </p>
      {hasFilters && (
        <Link
          className="text-xs text-[#C9A24B] underline underline-offset-4"
          href="/dashboard/admin/users"
        >
          Clear filters
        </Link>
      )}
    </div>
  )
}