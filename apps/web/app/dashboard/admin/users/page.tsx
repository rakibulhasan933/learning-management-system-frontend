import Link from "next/link"
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

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const query = await searchParams
  const params = new URLSearchParams()

  if (query.q) {
    params.set("q", query.q)
  }

  if (query.role) {
    params.set("role", query.role)
  }

  if (query.status) {
    params.set("status", query.status)
  }

  const response = await authenticatedApiFetch<AdminUserListResponse>(
    `/admin/users${params.size ? `?${params.toString()}` : ""}`,
    { cache: "no-store" },
  )

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Admin dashboard
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl tracking-tight">User management</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review account roles and suspend or reactivate access from the
              backend-owned user store.
            </p>
          </div>
          <Link
            className="border border-border px-4 py-2 text-sm text-foreground"
            href="/dashboard/admin"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <form className="border border-border bg-card p-4">
            <div className="mb-4">
              <h2 className="text-lg">Create instructor</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Admin-created instructor accounts are verified immediately and
                can sign in with the password you set here.
              </p>
            </div>
            <div className="grid gap-3">
              <input
                className="border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                name="fullName"
                placeholder="Instructor name"
              />
              <input
                autoComplete="email"
                className="border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                name="email"
                placeholder="Instructor email"
                required
                type="email"
              />
              <input
                autoComplete="new-password"
                className="border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                minLength={8}
                name="password"
                placeholder="Temporary password"
                required
                type="password"
              />
              <button
                className="bg-primary px-4 py-2 text-sm text-primary-foreground"
                formAction={createInstructorAction}
                type="submit"
              >
                Create instructor
              </button>
            </div>
          </form>

          <form className="grid gap-3 border border-border bg-card p-4 md:grid-cols-[1fr_170px_170px_auto]">
            <input
              className="border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              defaultValue={query.q ?? ""}
              name="q"
              placeholder="Search email or name"
            />
            <select
              className="border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              defaultValue={query.role ?? ""}
              name="role"
            >
              <option value="">All roles</option>
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
              <option value="student">Student</option>
            </select>
            <select
              className="border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              defaultValue={query.status ?? ""}
              name="status"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <button
              className="bg-primary px-4 py-2 text-sm text-primary-foreground"
              type="submit"
            >
              Filter
            </button>
          </form>
        </div>

        <div className="mt-6 overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-normal">User</th>
                <th className="px-4 py-3 font-normal">Role</th>
                <th className="px-4 py-3 font-normal">Provider</th>
                <th className="px-4 py-3 font-normal">Email</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">Joined</th>
                <th className="px-4 py-3 font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {response.users.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-5 text-muted-foreground"
                    colSpan={7}
                  >
                    No users match the current filters.
                  </td>
                </tr>
              ) : (
                response.users.map((user) => (
                  <tr className="border-b border-border" key={user.id}>
                    <td className="px-4 py-3">
                      <div className="font-mono">{user.email}</div>
                      <div className="text-muted-foreground">
                        {user.fullName ?? "No name"}
                      </div>
                    </td>
                    <td className="px-4 py-3">{user.role}</td>
                    <td className="px-4 py-3">{user.authProvider}</td>
                    <td className="px-4 py-3">
                      {user.emailVerifiedAt ? "Verified" : "Unverified"}
                    </td>
                    <td className="px-4 py-3">
                      {user.suspendedAt ? "Suspended" : "Active"}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={
                          user.suspendedAt
                            ? activateUserAction
                            : suspendUserAction
                        }
                      >
                        <input name="userId" type="hidden" value={user.id} />
                        <button
                          className={
                            user.suspendedAt
                              ? "border border-primary px-3 py-2 text-primary"
                              : "border border-destructive/50 px-3 py-2 text-destructive"
                          }
                          type="submit"
                        >
                          {user.suspendedAt ? "Activate" : "Suspend"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
