import type { Metadata } from "next"

import { PublicShell } from "@/components/public-shell"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { publicApiFetch } from "@/lib/api-client"
import { formatDate } from "@/lib/format"

export const metadata: Metadata = {
  title: "Verify certificate",
  description: "Check whether a Folio certificate verification code is valid.",
}

export const dynamic = "force-dynamic"

// The backend verify endpoint is expected to return a validity flag plus
// the certificate details on a match. Accept both a nested certificate
// object and flat fields so a minor shape difference does not break the page.
interface CertificateVerifyResponse {
  valid?: boolean
  certificate?: {
    courseTitle?: string
    studentName?: string
    issuedAt?: string
  } | null
  courseTitle?: string
  studentName?: string
  issuedAt?: string
}

export default async function VerifyCertificatePage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string }>
}) {
  const params = (await searchParams) ?? {}
  const code = (params.code ?? "").trim()

  let result: CertificateVerifyResponse | null = null
  let loadError = false
  if (code) {
    try {
      result = await publicApiFetch<CertificateVerifyResponse>(
        `/certificates/verify?code=${encodeURIComponent(code)}`,
        { cache: "no-store" }
      )
    } catch {
      loadError = true
    }
  }

  const certificate = result?.certificate ?? null
  const courseTitle = certificate?.courseTitle ?? result?.courseTitle
  const studentName = certificate?.studentName ?? result?.studentName
  const issuedAt = certificate?.issuedAt ?? result?.issuedAt
  const isValid =
    !loadError &&
    result !== null &&
    result.valid !== false &&
    Boolean(courseTitle && studentName)

  return (
    <PublicShell>
      <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        <PageHeader
          eyebrow="Certificates · Verification"
          lede="Enter the verification code printed on a certificate to check whether it is genuine. No account details are shown for an invalid code."
          title="Verify certificate"
        />

        <Card className="mt-10">
          <CardContent className="space-y-4">
            <form action="/verify" className="grid gap-3" method="get">
              <label className="grid gap-1 text-sm" htmlFor="code">
                <span className="text-muted-foreground">
                  Verification code
                </span>
                <input
                  className="h-10 rounded-xl border border-input bg-input/30 px-3 font-mono"
                  defaultValue={code}
                  id="code"
                  name="code"
                  required
                />
              </label>
              <button
                className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
                type="submit"
              >
                Verify
              </button>
            </form>

            {code && isValid ? (
              <div className="rounded-xl border border-border p-4">
                <p className="text-sm font-medium text-primary">
                  Valid certificate
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Course</dt>
                    <dd>{courseTitle}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Student</dt>
                    <dd>{studentName}</dd>
                  </div>
                  {issuedAt ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Issued</dt>
                      <dd>{formatDate(issuedAt)}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}

            {code && !isValid ? (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Invalid verification code. Please check the code and try
                again.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </PublicShell>
  )
}
