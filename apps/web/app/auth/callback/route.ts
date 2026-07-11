import { NextResponse, type NextRequest } from "next/server"
import type { AuthSessionDto } from "@workspace/types"

import { setAuthCookies } from "@/lib/api-client"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const accessToken = requestUrl.searchParams.get("access_token")
  const refreshToken = requestUrl.searchParams.get("refresh_token")
  const next = requestUrl.searchParams.get("next") ?? "/dashboard/student"

  if (accessToken && refreshToken) {
    await setAuthCookies(
      {
        accessToken,
        profile: {
          avatarUrl: null,
          email: "",
          fullName: null,
          id: "",
          role: "student",
        },
      } satisfies AuthSessionDto,
      refreshToken,
    )
  }

  return NextResponse.redirect(new URL(next, request.url))
}
