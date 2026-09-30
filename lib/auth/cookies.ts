export const accessTokenCookieName = "lms_access_token"
export const refreshTokenCookieName = "lms_refresh_token"

export function getBackendApiUrl(origin?: string) {
  const isBrowser = typeof window !== "undefined"
  // const url = isBrowser
  //   ? process.env.NEXT_PUBLIC_BACKEND_API_URL
  //   : (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_API_URL)

  const url = "https://learning-management-backend-jet.vercel.app";

  if (!url && (origin || isBrowser)) {
    const base = origin ?? window.location.origin
    return `${base.replace(/\/$/, "")}/api`
  }

  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_API_URL must be configured.")
  }

  return url.replace(/\/$/, "")
}
