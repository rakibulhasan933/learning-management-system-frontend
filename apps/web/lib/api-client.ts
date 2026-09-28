import { cookies } from "next/headers"
import type { AuthSessionDto } from "@workspace/types"

import {
  accessTokenCookieName,
  getBackendApiUrl,
  refreshTokenCookieName,
} from "@/lib/auth/cookies"

export { accessTokenCookieName, getBackendApiUrl, refreshTokenCookieName }

const accessTokenMaxAgeSeconds = 15 * 60
const refreshTokenMaxAgeSeconds = 30 * 24 * 60 * 60

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
  }
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { message?: string }
    | T
    | null

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      payload.message
        ? payload.message
        : "Request failed."

    throw new ApiClientError(response.status, message)
  }

  return payload as T
}

export async function publicApiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${getBackendApiUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  })

  return parseApiResponse<T>(response)
}

export async function setAuthCookies(
  session: AuthSessionDto,
  refreshToken?: string
) {
  const cookieStore = await cookies()
  const secure = process.env.NODE_ENV === "production"

  cookieStore.set(accessTokenCookieName, session.accessToken, {
    httpOnly: true,
    maxAge: accessTokenMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure,
  })

  if (refreshToken) {
    cookieStore.set(refreshTokenCookieName, refreshToken, {
      httpOnly: true,
      maxAge: refreshTokenMaxAgeSeconds,
      path: "/",
      sameSite: "lax",
      secure,
    })
  }
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()

  cookieStore.delete(accessTokenCookieName)
  cookieStore.delete(refreshTokenCookieName)
}

function getSetCookieValue(response: Response, name: string) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const setCookies = headers.getSetCookie?.() ?? []
  const header =
    setCookies.find((value) => value.startsWith(`${name}=`)) ??
    response.headers.get("set-cookie")

  if (!header?.includes(`${name}=`)) {
    return null
  }

  return header.split(`${name}=`)[1]?.split(";")[0] ?? null
}

async function refreshAccessToken() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(refreshTokenCookieName)?.value

  if (!refreshToken) {
    throw new ApiClientError(401, "Authentication is required.")
  }

  const response = await fetch(`${getBackendApiUrl()}/auth/refresh`, {
    headers: {
      Accept: "application/json",
      Cookie: `${refreshTokenCookieName}=${encodeURIComponent(refreshToken)}`,
    },
    method: "POST",
  })
  const session = await parseApiResponse<AuthSessionDto>(response)
  const rotatedRefreshToken =
    getSetCookieValue(response, refreshTokenCookieName) ?? refreshToken

  await setAuthCookies(session, rotatedRefreshToken)

  return session.accessToken
}

async function getAccessToken() {
  const cookieStore = await cookies()

  return cookieStore.get(accessTokenCookieName)?.value ?? null
}

export async function authenticatedApiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  let accessToken = await getAccessToken()

  if (!accessToken) {
    accessToken = await refreshAccessToken()
  }

  const request = async (token: string) =>
    fetch(`${getBackendApiUrl()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    })

  let response = await request(accessToken)

  if (response.status === 401) {
    accessToken = await refreshAccessToken()
    response = await request(accessToken)
  }

  return parseApiResponse<T>(response)
}

export async function optionalAuthenticatedApiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  // No refresh fallback on purpose: this runs in server components, which can
  // read cookies but not write them, so a rotated token pair could not be
  // persisted and refreshing here would revoke the session. The proxy renews
  // the access token at the edge before the request reaches this point.
  const accessToken = await getAccessToken()

  const response = await fetch(`${getBackendApiUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  })

  return parseApiResponse<T>(response)
}
