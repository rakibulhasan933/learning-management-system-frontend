import { NextResponse } from "next/server"
import { authenticatedApiFetch } from "@/lib/api-client"

function csvValue(value: unknown) { const text = value == null ? "" : String(value); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text }
export async function GET(_request: Request, { params }: { params: Promise<{ report: string }> }) {
  const { report } = await params
  const payload = await authenticatedApiFetch<{ rows: Record<string, unknown>[] }>(`/admin/reports/${encodeURIComponent(report)}`, { cache: "no-store" })
  const rows = payload.rows ?? []
  const headers = rows[0] ? Object.keys(rows[0]) : []
  const body = [headers, ...rows.map((row) => headers.map((header) => row[header]))].map((row) => row.map(csvValue).join(",")).join("\n")
  return new NextResponse(body, { headers: { "Content-Disposition": `attachment; filename=${report}.csv`, "Content-Type": "text/csv; charset=utf-8" } })
}
