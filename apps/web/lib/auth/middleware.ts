import { NextResponse, type NextRequest } from "next/server"
import type { AuthSessionDto, ProfileDto, UserRole } from "@workspace/types"

import {
  accessTokenCookieName,
  getBackendApiUrl,
  refreshTokenCookieName,
} from "@/lib/auth/cookies"
import { getDashboardPath } from "@/lib/auth/dashboard"

const accessTokenMaxAgeSeconds = 15 * 60
const refreshTokenMaxAgeSeconds = 30 * 24 * 60 * 60

const protectedRoutes: Array<{
  prefix: string
  roles?: UserRole[]
}> = [
  { prefix: "/learn" },
  { prefix: "/dashboard/student", roles: ["student"] },
  { prefix: "/dashboard/instructor", roles: ["instructor"] },
  { prefix: "/dashboard/admin", roles: ["admin"] },
]

type RefreshedSession = AuthSessionDto & { refreshToken: string }

function getMatchedProtectedRoute(pathname: string) {
  return protectedRoutes.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function redirectTo(
  request: NextRequest,
  pathname: string,
  params?: URLSearchParams
) {
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

async function refreshSession(
  refreshToken: string
): Promise<RefreshedSession | null> {
  const response = await fetch(`${getBackendApiUrl()}/auth/refresh`, {
    headers: {
      Accept: "application/json",
      Cookie: `${refreshTokenCookieName}=${encodeURIComponent(refreshToken)}`,
    },
    method: "POST",
  }).catch(() => null)

  if (!response?.ok) {
    return null
  }

  const session = (await response.json()) as AuthSessionDto
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const setCookies = headers.getSetCookie?.() ?? []
  const setCookieHeader = response.headers.get("set-cookie")
  const refreshCookie =
    setCookies.find((value) =>
      value.startsWith(`${refreshTokenCookieName}=`)
    ) ??
    (setCookieHeader?.includes(`${refreshTokenCookieName}=`)
      ? setCookieHeader
      : null)
  const rotatedRefreshToken = refreshCookie
    ?.split(`${refreshTokenCookieName}=`)[1]
    ?.split(";")[0]

  return { ...session, refreshToken: rotatedRefreshToken ?? refreshToken }
}

/**
 * Persists a rotated token pair. The backend revokes the presented refresh
 * token, so the new pair has to land in the response or the session is lost.
 */
function applySession(request: NextRequest, session: RefreshedSession) {
  const secure = process.env.NODE_ENV === "production"

  request.cookies.set(accessTokenCookieName, session.accessToken)

  const response = NextResponse.next({ request })

  response.cookies.set(accessTokenCookieName, session.accessToken, {
    httpOnly: true,
    maxAge: accessTokenMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure,
  })
  response.cookies.set(refreshTokenCookieName, session.refreshToken, {
    httpOnly: true,
    maxAge: refreshTokenMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure,
  })

  return response
}

function clearSession(request: NextRequest) {
  request.cookies.delete(accessTokenCookieName)
  request.cookies.delete(refreshTokenCookieName)

  const response = NextResponse.next({ request })

  response.cookies.delete(accessTokenCookieName)
  response.cookies.delete(refreshTokenCookieName)

  return response
}

export async function updateSession(request: NextRequest) {
  const route = getMatchedProtectedRoute(request.nextUrl.pathname)
  const accessToken = request.cookies.get(accessTokenCookieName)?.value
  const refreshToken = request.cookies.get(refreshTokenCookieName)?.value

  // Public pages still read the session (a course page needs to know the viewer
  // is already enrolled). Server components can read cookies but cannot write
  // them, so the short-lived access token has to be renewed here or those pages
  // silently degrade the signed-in viewer to an anonymous visitor.
  if (!route) {
    if (accessToken || !refreshToken) {
      return NextResponse.next({ request })
    }

    const session = await refreshSession(refreshToken)

    return session ? applySession(request, session) : clearSession(request)
  }

  const profile = accessToken ? await getProfile(accessToken) : null

  if (!profile && refreshToken) {
    const session = await refreshSession(refreshToken)

    if (session) {
      const response = applySession(request, session)

      if (route.roles && !route.roles.includes(session.profile.role)) {
        return redirectTo(request, getDashboardPath(session.profile.role))
      }

      return response
    }
  }

  if (!profile) {
    const params = new URLSearchParams({ next: request.nextUrl.pathname })

    return redirectTo(request, "/auth/login", params)
  }

  if (route.roles && !route.roles.includes(profile.role)) {
    return redirectTo(request, getDashboardPath(profile.role))
  }

  return NextResponse.next({ request })
}
