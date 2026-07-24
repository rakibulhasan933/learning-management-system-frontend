export const accessTokenCookieName = "lms_access_token"
export const refreshTokenCookieName = "lms_refresh_token"

export function getBackendApiUrl() {
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;


  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_API_URL must be configured.")
  }

  return url.replace(/\/$/, "")
}
