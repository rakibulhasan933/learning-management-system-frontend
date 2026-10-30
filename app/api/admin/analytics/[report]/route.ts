import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { accessTokenCookieName, getBackendApiUrl } from "@/lib/api-client"

const allowedReports = [
  "funnel",
  "cohorts",
  "refund-reasons",
  "teachers",
] as const

/**
 * CSV export proxy: GET /admin/analytics/:report/export on the backend
 * streams the CSV; the web app only forwards it as a download.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ report: string }> }
) {
  const { report } = await params

  if (!(allowedReports as readonly string[]).includes(report)) {
    return NextResponse.json({ message: "Unknown report." }, { status: 404 })
  }

  const cookieStore = await cookies()
  const accessToken = cookieStore.get(accessTokenCookieName)?.value
  if (!accessToken) {
    return NextResponse.json(
      { message: "Authentication is required." },
      { status: 401 }
    )
  }

  const response = await fetch(
    `${getBackendApiUrl()}/admin/analytics/${report}/export`,
    {
      cache: "no-store",
      headers: {
        Accept: "text/csv",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  ).catch(() => null)

  if (!response || !response.ok) {
    return NextResponse.json(
      { message: "Export failed." },
      { status: response?.status ?? 502 }
    )
  }

  const body = await response.text()
  return new NextResponse(body, {
    headers: {
      "Content-Disposition": `attachment; filename=analytics-${report}.csv`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  })
}
