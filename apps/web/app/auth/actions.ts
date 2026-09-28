"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import type { AuthSessionDto } from "@workspace/types"

import {
  ApiClientError,
  clearAuthCookies,
  getBackendApiUrl,
  publicApiFetch,
  refreshTokenCookieName,
  setAuthCookies,
} from "@/lib/api-client"
import { getDashboardPath } from "@/lib/auth/dashboard"

export interface AuthFormState {
  fieldErrors: {
    email?: string
    fullName?: string
    password?: string
  }
  formError: string | null
  unverifiedEmail: string | null
}

const defaultAuthFormState: AuthFormState = {
  fieldErrors: {},
  formError: null,
  unverifiedEmail: null,
}

function redirectWithError(pathname: string, message: string): never {
  const separator = pathname.includes("?") ? "&" : "?"

  redirect(`${pathname}${separator}error=${encodeURIComponent(message)}`)
}

function isNextRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  )
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  return value.trim()
}

async function getOrigin() {
  const headerStore = await headers()

  return headerStore.get("origin") ?? "http://localhost:3000"
}

function getRefreshTokenFromResponse(response: Response) {
  const headersWithSetCookie = response.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const setCookies = headersWithSetCookie.getSetCookie?.() ?? []
  const header =
    setCookies.find((value) =>
      value.startsWith(`${refreshTokenCookieName}=`)
    ) ?? response.headers.get("set-cookie")

  if (!header?.includes(`${refreshTokenCookieName}=`)) {
    return null
  }

  return header.split(`${refreshTokenCookieName}=`)[1]?.split(";")[0] ?? null
}

async function postAuthSession(path: string, body: unknown) {
  const response = await fetch(`${getBackendApiUrl()}${path}`, {
    body: JSON.stringify(body),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  })
  const payload = (await response.json().catch(() => null)) as
    | AuthSessionDto
    | { message?: string }
    | null

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      payload.message
        ? payload.message
        : "Authentication failed."

    throw new ApiClientError(response.status, message)
  }

  const refreshToken = getRefreshTokenFromResponse(response)

  await setAuthCookies(payload as AuthSessionDto, refreshToken ?? undefined)

  return payload as AuthSessionDto
}

function createAuthFormState(
  overrides: Partial<AuthFormState> = {}
): AuthFormState {
  return {
    ...defaultAuthFormState,
    ...overrides,
    fieldErrors: {
      ...defaultAuthFormState.fieldErrors,
      ...overrides.fieldErrors,
    },
  }
}

function mapLoginError(error: unknown, email: string): AuthFormState {
  if (error instanceof ApiClientError) {
    if (
      error.status === 403 &&
      error.message.toLowerCase().includes("verify")
    ) {
      return createAuthFormState({
        formError: error.message,
        unverifiedEmail: email,
      })
    }

    if (error.status === 401) {
      return createAuthFormState({
        fieldErrors: {
          password: "Invalid email or password.",
        },
      })
    }
  }

  return createAuthFormState({
    formError:
      error instanceof Error
        ? error.message
        : "Sign in could not be completed.",
  })
}

function mapSignupError(error: unknown): AuthFormState {
  if (error instanceof ApiClientError && error.status === 409) {
    return createAuthFormState({
      fieldErrors: {
        email: "An account with this email already exists.",
      },
    })
  }

  return createAuthFormState({
    formError:
      error instanceof Error ? error.message : "Account could not be created.",
  })
}

export async function signInWithPasswordAction(formData: FormData) {
  const email = getRequiredString(formData, "email")
  const password = getRequiredString(formData, "password")
  const next = getRequiredString(formData, "next")

  if (!email || !password) {
    redirectWithError("/auth/login", "Email and password are required.")
  }

  try {
    const session = await postAuthSession("/auth/login", { email, password })

    redirect(next ?? getDashboardPath(session.profile.role))
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error
    }

    if (
      error instanceof ApiClientError &&
      error.status === 403 &&
      error.message.toLowerCase().includes("verify")
    ) {
      redirect(
        `/auth/login?error=${encodeURIComponent(error.message)}&unverifiedEmail=${encodeURIComponent(email)}`
      )
    }

    redirectWithError(
      "/auth/login",
      error instanceof Error ? error.message : "Sign in failed."
    )
  }
}

export async function signInWithPasswordFormAction(
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = getRequiredString(formData, "email")
  const password = getRequiredString(formData, "password")
  const next = getRequiredString(formData, "next")

  if (!email) {
    return createAuthFormState({
      fieldErrors: { email: "Email is required." },
    })
  }

  if (!password) {
    return createAuthFormState({
      fieldErrors: { password: "Password is required." },
    })
  }

  try {
    const session = await postAuthSession("/auth/login", { email, password })

    redirect(next ?? getDashboardPath(session.profile.role))
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error
    }

    return mapLoginError(error, email)
  }
}

export async function resendVerificationEmailAction(formData: FormData) {
  const email = getRequiredString(formData, "email")
  const origin = await getOrigin()

  if (!email) {
    redirectWithError("/auth/login", "Email is required.")
  }

  try {
    await publicApiFetch("/auth/verification/resend", {
      body: JSON.stringify({ email, origin }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
  } catch (error) {
    redirectWithError(
      `/auth/login?unverifiedEmail=${encodeURIComponent(email)}`,
      error instanceof Error
        ? error.message
        : "Verification email could not be resent."
    )
  }

  redirect("/auth/verify")
}

export async function signInWithGoogleAction(formData: FormData) {
  const origin = await getOrigin()
  const next = getRequiredString(formData, "next")
  const state = Buffer.from(JSON.stringify({ next, origin })).toString(
    "base64url"
  )
  const url = new URL("/auth/google", getBackendApiUrl())

  url.searchParams.set("state", state)

  redirect(url.toString())
}

export async function signUpWithPasswordAction(formData: FormData) {
  const email = getRequiredString(formData, "email")
  const password = getRequiredString(formData, "password")
  const fullName = getRequiredString(formData, "fullName")
  const origin = await getOrigin()

  if (!email || !password) {
    redirectWithError("/auth/signup", "Email and password are required.")
  }

  try {
    await publicApiFetch("/auth/signup", {
      body: JSON.stringify({
        email,
        fullName,
        origin,
        password,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
  } catch (error) {
    redirectWithError(
      "/auth/signup",
      error instanceof Error ? error.message : "Account could not be created."
    )
  }

  redirect("/auth/verify")
}

export async function signUpWithPasswordFormAction(
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = getRequiredString(formData, "email")
  const password = getRequiredString(formData, "password")
  const fullName = getRequiredString(formData, "fullName")
  const origin = await getOrigin()

  if (!email) {
    return createAuthFormState({
      fieldErrors: { email: "Email is required." },
    })
  }

  if (!fullName) {
    return createAuthFormState({
      fieldErrors: { fullName: "Full name is required." },
    })
  }

  if (!password) {
    return createAuthFormState({
      fieldErrors: { password: "Password is required." },
    })
  }

  try {
    await publicApiFetch("/auth/signup", {
      body: JSON.stringify({
        email,
        fullName,
        origin,
        password,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
  } catch (error) {
    return mapSignupError(error)
  }

  redirect("/auth/verify")
}

export async function sendPasswordResetAction(formData: FormData) {
  const email = getRequiredString(formData, "email")
  const origin = await getOrigin()

  if (!email) {
    redirectWithError("/auth/reset-password", "Email is required.")
  }

  try {
    await publicApiFetch("/auth/password-reset/request", {
      body: JSON.stringify({ email, origin }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
  } catch (error) {
    redirectWithError(
      "/auth/reset-password",
      error instanceof Error ? error.message : "Password reset failed."
    )
  }

  redirect("/auth/verify?mode=reset")
}

export async function confirmPasswordResetAction(formData: FormData) {
  const password = getRequiredString(formData, "password")
  const token = getRequiredString(formData, "token")

  if (!password || !token) {
    redirectWithError(
      "/auth/reset-password",
      "Password and reset token are required."
    )
  }

  try {
    await publicApiFetch("/auth/password-reset/confirm", {
      body: JSON.stringify({ password, token }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
  } catch (error) {
    redirectWithError(
      `/auth/reset-password?token=${encodeURIComponent(token)}`,
      error instanceof Error ? error.message : "Password reset failed."
    )
  }

  redirect("/auth/login")
}

export async function signOutAction() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(refreshTokenCookieName)?.value

  if (refreshToken) {
    await fetch(`${getBackendApiUrl()}/auth/logout`, {
      headers: {
        Cookie: `${refreshTokenCookieName}=${encodeURIComponent(refreshToken)}`,
      },
      method: "POST",
    }).catch(() => null)
  }

  await clearAuthCookies()
  redirect("/auth/login")
}
