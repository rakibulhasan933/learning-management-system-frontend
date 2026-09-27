import { Award, FileCheck } from "lucide-react"
import type { CertificateListResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@workspace/ui/components/card"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { PageHeader } from "@workspace/ui/components/page-header"
import { SubmitButton } from "@/components/submit-button"
import { formatDate } from "@/lib/format"
import { downloadCertificateAction } from "../certificates/actions"

export const dynamic = "force-dynamic"

export default async function StudentCertificatesPage() {
  const response = await authenticatedApiFetch<CertificateListResponse>("/certificates")
  return <><PageHeader eyebrow="Student dashboard · Certificates" lede="Download certificates issued for your completed courses." title="Certificates" /><Card className="mt-10"><CardContent className="space-y-3">{response.certificates.length === 0 ? <EmptyState description="Complete every published lecture in a course to unlock its certificate." icon={<Award />} title="No certificates yet" /> : response.certificates.map((certificate) => <div className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" key={certificate.id}><div className="flex items-start gap-3"><FileCheck className="mt-0.5 size-4 text-secondary" /><div><p>{certificate.courseTitle}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{certificate.verificationCode} · {formatDate(certificate.issuedAt)}</p></div></div><form action={downloadCertificateAction}><input name="certificateId" type="hidden" value={certificate.id} /><SubmitButton className="w-full md:w-auto" pendingLabel="Preparing download..." variant="outline">Download certificate</SubmitButton></form></div>)}</CardContent></Card></>
}
