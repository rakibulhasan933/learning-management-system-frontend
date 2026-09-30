import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const next = new URL(request.url).searchParams.get("next")

  return NextResponse.redirect(new URL(next ?? "/auth/login", request.url))
}
