import bcrypt from "bcryptjs"
import { and, eq, isNull, users } from "@workspace/db"
import {
  emailVerificationTokens,
  passwordResetTokens,
  profiles,
  refreshTokens,
} from "@workspace/db"
import { Router, type Response, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type { AuthSessionDto } from "@workspace/types"

import { env } from "../config/env.js"
import { asyncHandler, HttpError } from "../http/errors.js"
import {
  clearAuthCookies,
  createOpaqueToken,
  getRefreshTokenExpiresAt,
  hashActionToken,
  hashRefreshToken,
  refreshTokenCookieName,
  setAuthCookies,
  signAccessToken,
} from "../lib/auth-tokens.js"
import { db } from "../lib/database.js"
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../lib/mailer.js"
import { getProfileByUserId, toProfileDto } from "../lib/profiles.js"
import { requireAuth } from "../middleware/auth.js"

export const authRouter: ExpressRouter = Router()

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
})
const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(1).max(160).nullable().optional(),
  origin: z.string().url().optional(),
})
const resetRequestSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  origin: z.string().url().optional(),
})
const resendVerificationSchema = resetRequestSchema
const resetConfirmSchema = z.object({
  password: z.string().min(8),
  token: z.string().min(20),
})
const googleCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
})

function parseCookies(header: string | undefined) {
  return Object.fromEntries(
    (header ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=")

        if (separatorIndex === -1) {
          return [part, ""]
        }

        return [
          decodeURIComponent(part.slice(0, separatorIndex)),
          decodeURIComponent(part.slice(separatorIndex + 1)),
        ]
      }),
  )
}

function getRequestRefreshToken(cookieHeader: string | undefined) {
  return parseCookies(cookieHeader)[refreshTokenCookieName] ?? null
}

function getTokenExpiry(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

function getDefaultOrigin(origin: string | undefined) {
  return origin ?? env.CORS_ORIGIN
}

function getVerificationUrl(token: string, origin?: string) {
  const verificationUrl = new URL("/auth/verify", getDefaultOrigin(origin))
  verificationUrl.searchParams.set("token", token)

  return verificationUrl.toString()
}

function getPasswordResetUrl(token: string, origin?: string) {
  const resetUrl = new URL("/auth/reset-password", getDefaultOrigin(origin))
  resetUrl.searchParams.set("token", token)

  return resetUrl.toString()
}

async function issueSession(userId: string) {
  const profile = await getProfileByUserId(userId)

  if (!profile) {
    throw new HttpError(500, "Profile could not be loaded.")
  }

  const accessToken = signAccessToken({
    email: profile.email,
    profileId: profile.id,
    role: profile.role,
    sub: userId,
  })
  const refreshToken = createOpaqueToken()
  const [storedRefreshToken] = await db
    .insert(refreshTokens)
    .values({
      expiresAt: getRefreshTokenExpiresAt(),
      tokenHash: hashRefreshToken(refreshToken),
      userId,
    })
    .returning()

  if (!storedRefreshToken) {
    throw new HttpError(500, "Session could not be created.")
  }

  return {
    accessToken,
    profile: toProfileDto(profile),
    refreshToken,
  }
}

function sendSession(
  response: Response,
  session: Awaited<ReturnType<typeof issueSession>>,
) {
  setAuthCookies(response, session.accessToken, session.refreshToken)

  const payload: AuthSessionDto = {
    accessToken: session.accessToken,
    profile: session.profile,
  }

  response.status(200).json(payload)
}

async function createVerificationToken(userId: string) {
  const token = createOpaqueToken()
  await db.insert(emailVerificationTokens).values({
    expiresAt: getTokenExpiry(24),
    tokenHash: hashActionToken(token),
    userId,
  })

  return token
}

function parseGoogleState(state: string | undefined) {
  if (!state) {
    return {}
  }

  try {
    return JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
      next?: string
      origin?: string
    }
  } catch {
    return {}
  }
}

authRouter.post(
  "/signup",
  asyncHandler(async (request, response) => {
    const input = signupSchema.parse(request.body)
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    })

    if (existingUser) {
      throw new HttpError(409, "An account with this email already exists.")
    }

    const passwordHash = await bcrypt.hash(input.password, 12)
    const createdUser = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          authProvider: "password",
          email: input.email,
          passwordHash,
        })
        .returning()

      if (!user) {
        throw new HttpError(500, "Account could not be created.")
      }

      await tx.insert(profiles).values({
        fullName: input.fullName ?? null,
        role: "student",
        userId: user.id,
      })

      return user
    })
    const verificationToken = await createVerificationToken(createdUser.id)

    await sendVerificationEmail({
      email: input.email,
      verificationUrl: getVerificationUrl(verificationToken, input.origin),
    })

    response.status(201).json({ message: "Account created. Verify your email." })
  }),
)

authRouter.post(
  "/login",
  asyncHandler(async (request, response) => {
    const input = loginSchema.parse(request.body)
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    })

    if (!user?.passwordHash) {
      throw new HttpError(401, "Invalid email or password.")
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash)

    if (!passwordMatches) {
      throw new HttpError(401, "Invalid email or password.")
    }

    if (!user.emailVerifiedAt) {
      throw new HttpError(403, "Please verify your email before signing in.")
    }

    const session = await issueSession(user.id)

    sendSession(response, session)
  }),
)

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    response.status(200).json(toProfileDto(request.auth!.profile))
  }),
)

authRouter.post(
  "/refresh",
  asyncHandler(async (request, response) => {
    const refreshToken = getRequestRefreshToken(request.get("cookie"))

    if (!refreshToken) {
      throw new HttpError(401, "Authentication is required.")
    }

    const tokenHash = hashRefreshToken(refreshToken)
    const [storedToken] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
        ),
      )
      .limit(1)

    if (!storedToken || storedToken.expiresAt <= new Date()) {
      throw new HttpError(401, "Authentication is required.")
    }

    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, storedToken.id))

    const session = await issueSession(storedToken.userId)

    sendSession(response, session)
  }),
)

authRouter.post(
  "/logout",
  asyncHandler(async (request, response) => {
    const refreshToken = getRequestRefreshToken(request.get("cookie"))

    if (refreshToken) {
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.tokenHash, hashRefreshToken(refreshToken)))
    }

    clearAuthCookies(response)
    response.status(204).send()
  }),
)

authRouter.get(
  "/verify",
  asyncHandler(async (request, response) => {
    const token = z.string().min(20).parse(request.query.token)
    const tokenHash = hashActionToken(token)
    const [storedToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.tokenHash, tokenHash),
          isNull(emailVerificationTokens.usedAt),
        ),
      )
      .limit(1)

    if (!storedToken || storedToken.expiresAt <= new Date()) {
      throw new HttpError(400, "Verification link is invalid or expired.")
    }

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ emailVerifiedAt: new Date() })
        .where(eq(users.id, storedToken.userId))
      await tx
        .update(emailVerificationTokens)
        .set({ usedAt: new Date() })
        .where(eq(emailVerificationTokens.id, storedToken.id))
    })

    response.status(200).json({ message: "Email verified." })
  }),
)

authRouter.post(
  "/password-reset/request",
  asyncHandler(async (request, response) => {
    const input = resetRequestSchema.parse(request.body)
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    })

    if (user) {
      const token = createOpaqueToken()

      await db.insert(passwordResetTokens).values({
        expiresAt: getTokenExpiry(1),
        tokenHash: hashActionToken(token),
        userId: user.id,
      })
      await sendPasswordResetEmail({
        email: input.email,
        resetUrl: getPasswordResetUrl(token, input.origin),
      })
    }

    response.status(200).json({
      message: "If the email exists, a password reset link has been sent.",
    })
  }),
)

authRouter.post(
  "/verification/resend",
  asyncHandler(async (request, response) => {
    const input = resendVerificationSchema.parse(request.body)
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    })

    if (user && !user.emailVerifiedAt) {
      const token = await createVerificationToken(user.id)

      await sendVerificationEmail({
        email: input.email,
        verificationUrl: getVerificationUrl(token, input.origin),
      })
    }

    response.status(200).json({
      message: "If the email needs verification, a new link has been sent.",
    })
  }),
)

authRouter.post(
  "/password-reset/confirm",
  asyncHandler(async (request, response) => {
    const input = resetConfirmSchema.parse(request.body)
    const tokenHash = hashActionToken(input.token)
    const [storedToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
        ),
      )
      .limit(1)

    if (!storedToken || storedToken.expiresAt <= new Date()) {
      throw new HttpError(400, "Password reset link is invalid or expired.")
    }

    const passwordHash = await bcrypt.hash(input.password, 12)

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ authProvider: "password", passwordHash })
        .where(eq(users.id, storedToken.userId))
      await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, storedToken.id))
    })

    response.status(200).json({ message: "Password has been reset." })
  }),
)

authRouter.get("/google", (request, response) => {
  if (
    !env.GOOGLE_OAUTH_CLIENT_ID ||
    !env.GOOGLE_OAUTH_REDIRECT_URI ||
    !env.GOOGLE_OAUTH_CLIENT_SECRET
  ) {
    throw new HttpError(500, "Google OAuth is not configured.")
  }

  const state = typeof request.query.state === "string" ? request.query.state : ""
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  url.searchParams.set("client_id", env.GOOGLE_OAUTH_CLIENT_ID)
  url.searchParams.set("redirect_uri", env.GOOGLE_OAUTH_REDIRECT_URI)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", "openid email profile")
  url.searchParams.set("state", state)
  url.searchParams.set("access_type", "offline")
  url.searchParams.set("prompt", "select_account")

  response.redirect(url.toString())
})

authRouter.get(
  "/google/callback",
  asyncHandler(async (request, response) => {
    if (
      !env.GOOGLE_OAUTH_CLIENT_ID ||
      !env.GOOGLE_OAUTH_REDIRECT_URI ||
      !env.GOOGLE_OAUTH_CLIENT_SECRET
    ) {
      throw new HttpError(500, "Google OAuth is not configured.")
    }

    const input = googleCallbackSchema.parse(request.query)
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      body: new URLSearchParams({
        client_id: env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
        code: input.code,
        grant_type: "authorization_code",
        redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URI,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    })

    if (!tokenResponse.ok) {
      throw new HttpError(401, "Google OAuth exchange failed.")
    }

    const tokenPayload = (await tokenResponse.json()) as { access_token?: string }

    if (!tokenPayload.access_token) {
      throw new HttpError(401, "Google OAuth exchange failed.")
    }

    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenPayload.access_token}`,
        },
      },
    )

    if (!profileResponse.ok) {
      throw new HttpError(401, "Google profile lookup failed.")
    }

    const googleProfile = (await profileResponse.json()) as {
      email?: string
      email_verified?: boolean
      name?: string
      picture?: string
      sub?: string
    }

    if (!googleProfile.email || !googleProfile.sub) {
      throw new HttpError(401, "Google profile is missing required fields.")
    }

    const email = googleProfile.email.toLowerCase()
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      user = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(users)
          .values({
            authProvider: "google",
            email,
            emailVerifiedAt: googleProfile.email_verified ? new Date() : null,
            googleId: googleProfile.sub,
          })
          .returning()

        if (!created) {
          throw new HttpError(500, "Account could not be created.")
        }

        await tx.insert(profiles).values({
          avatarUrl: googleProfile.picture ?? null,
          fullName: googleProfile.name ?? null,
          role: "student",
          userId: created.id,
        })

        return created
      })
    } else if (!user.googleId) {
      const [updated] = await db
        .update(users)
        .set({
          authProvider: user.passwordHash ? user.authProvider : "google",
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          googleId: googleProfile.sub,
        })
        .where(eq(users.id, user.id))
        .returning()

      user = updated ?? user
    }

    const session = await issueSession(user.id)
    const state = parseGoogleState(input.state)
    const origin = state.origin ?? env.CORS_ORIGIN
    const redirectUrl = new URL(state.next ?? "/dashboard/student", origin)

    setAuthCookies(response, session.accessToken, session.refreshToken)
    response.redirect(redirectUrl.toString())
  }),
)
