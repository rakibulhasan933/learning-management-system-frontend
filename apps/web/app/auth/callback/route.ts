import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const next = requestUrl.searchParams.get("next") ?? "/dashboard/student"

  return NextResponse.redirect(new URL(next, request.url))
}
