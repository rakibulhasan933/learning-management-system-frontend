import type { AdminAuditLogListResponse } from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"
export default async function AdminAuditLogsPage() {
  const { logs } = await authenticatedApiFetch<AdminAuditLogListResponse>(
    "/admin/audit-logs?limit=250",
    { cache: "no-store" }
  )
  return (
    <>
      <PageHeader
        eyebrow="Admin dashboard · Accountability"
        title="Audit log"
        lede="A searchable-ready timeline of administrative actions and payment/course decisions."
      />
      <Card className="mt-8">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-3">When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr className="border-b border-border/60" key={log.id}>
                    <td className="py-3 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>{log.actorEmail ?? "System"}</td>
                    <td className="font-mono text-xs">{log.action}</td>
                    <td>
                      {log.entityType}
                      {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}
                    </td>
                    <td className="max-w-[280px] truncate text-xs text-muted-foreground">
                      {JSON.stringify(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <p className="py-6 text-sm text-muted-foreground">
                No audit events yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
