import { NextResponse, type NextRequest } from "next/server"
import type { AuthSessionDto, ProfileDto, UserRole } from "@workspace/types"

import {
  accessTokenCookieName,
  getBackendApiUrl,
  refreshTokenCookieName,
} from "@/lib/auth/cookies"

const protectedRoutes: Array<{
  prefix: string
  roles?: UserRole[]
}> = [
  { prefix: "/learn" },
  { prefix: "/dashboard/student", roles: ["admin", "student"] },
  { prefix: "/dashboard/instructor", roles: ["admin", "instructor"] },
  { prefix: "/dashboard/admin", roles: ["admin"] },
]

function getMatchedProtectedRoute(pathname: string) {
  return protectedRoutes.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function redirectTo(request: NextRequest, pathname: string, params?: URLSearchParams) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = params?.toString() ?? ""

  return NextResponse.redirect(url)
}

async function getProfile(accessToken: string) {
  const response = await fetch(`${getBackendApiUrl()}/auth/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    return null
  }

  return (await response.json()) as ProfileDto
}

async function refreshSession(refreshToken: string) {
  const response = await fetch(`${getBackendApiUrl()}/auth/refresh`, {
    headers: {
      Accept: "application/json",
      Cookie: `${refreshTokenCookieName}=${encodeURIComponent(refreshToken)}`,
    },
    method: "POST",
  })

  if (!response.ok) {
    return null
  }

  const session = (await response.json()) as AuthSessionDto
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const setCookies = headers.getSetCookie?.() ?? []
  const setCookieHeader = response.headers.get("set-cookie")
  const refreshCookie =
    setCookies.find((value) => value.startsWith(`${refreshTokenCookieName}=`)) ??
    (setCookieHeader?.includes(`${refreshTokenCookieName}=`)
      ? setCookieHeader
      : null)
  const rotatedRefreshToken = refreshCookie
    ?.split(`${refreshTokenCookieName}=`)[1]
    ?.split(";")[0]

  return { ...session, refreshToken: rotatedRefreshToken ?? refreshToken }
}

export async function updateSession(request: NextRequest) {
  const route = getMatchedProtectedRoute(request.nextUrl.pathname)
  let response = NextResponse.next({ request })

  if (!route) {
    return response
  }

  const accessToken = request.cookies.get(accessTokenCookieName)?.value
  let profile = accessToken ? await getProfile(accessToken) : null

  if (!profile) {
    const refreshToken = request.cookies.get(refreshTokenCookieName)?.value
    const session = refreshToken ? await refreshSession(refreshToken) : null

    if (session) {
      request.cookies.set(accessTokenCookieName, session.accessToken)
      response = NextResponse.next({ request })
      response.cookies.set(accessTokenCookieName, session.accessToken, {
        httpOnly: true,
        maxAge: 15 * 60,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
      response.cookies.set(refreshTokenCookieName, session.refreshToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
      profile = session.profile
    }
  }

  if (!profile) {
    const params = new URLSearchParams({ next: request.nextUrl.pathname })

    return redirectTo(request, "/auth/login", params)
  }

  if (route.roles && !route.roles.includes(profile.role)) {
    return redirectTo(request, "/dashboard/student")
  }

  return response
}
