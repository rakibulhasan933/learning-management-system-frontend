import { authenticatedApiFetch } from "@/lib/api-client"
import type {
  CertificateListResponse,
  ProfileDto,
  StudentOrderListResponse,
} from "@workspace/types"

import { downloadCertificateAction } from "./certificates/actions"

export const dynamic = "force-dynamic"

export default async function StudentDashboardPage() {
  const profile = await authenticatedApiFetch<ProfileDto>("/auth/me")
  const orderResponse =
    await authenticatedApiFetch<StudentOrderListResponse>("/payments/my-orders")
  const certificateResponse =
    await authenticatedApiFetch<CertificateListResponse>("/certificates")

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Student dashboard
        </p>
        <h1 className="mt-3 text-4xl tracking-tight">Your learning workspace</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Track enrollment reviews, resume learning, and download certificates
          once your completed courses are issued.
        </p>
        <div className="mt-8 border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="mt-1 font-mono text-sm">{profile.email}</p>
        </div>
        <div id="orders" className="mt-6 border border-border bg-card p-5">
          <p className="font-mono text-sm text-muted-foreground">
            Payment status
          </p>
          <h2 className="mt-2 text-2xl">Your orders</h2>
          <div className="mt-5 space-y-3">
            {orderResponse.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No enrollment orders yet.
              </p>
            ) : (
              orderResponse.orders.map((order) => (
                <div
                  className="grid gap-3 border border-border p-4 text-sm md:grid-cols-[1fr_auto]"
                  key={order.id}
                >
                  <div>
                    <p className="text-base text-foreground">
                      {order.courseTitle}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {order.referenceCode} · {order.currency} {order.amount}
                    </p>
                    {order.rejectionReason ? (
                      <p className="mt-2 text-destructive">
                        {order.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <span className="border border-primary px-2 py-1 font-mono text-xs text-primary">
                      {order.status.replace("_", " ")}
                    </span>
                    {order.status === "rejected" ? (
                      <a
                        className="text-primary hover:text-foreground"
                        href={`/courses/${order.courseSlug}/enroll?orderId=${order.id}`}
                      >
                        Resubmit proof
                      </a>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div id="certificates" className="mt-6 border border-border bg-card p-5">
          <p className="font-mono text-sm text-muted-foreground">
            Certificates
          </p>
          <h2 className="mt-2 text-2xl">Completed courses</h2>
          <div className="mt-5 space-y-3">
            {certificateResponse.certificates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Complete every published lecture in a course to unlock its
                certificate.
              </p>
            ) : (
              certificateResponse.certificates.map((certificate) => (
                <div
                  className="grid gap-3 border border-border p-4 text-sm md:grid-cols-[1fr_auto]"
                  key={certificate.id}
                >
                  <div>
                    <p className="text-base text-foreground">
                      {certificate.courseTitle}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {certificate.verificationCode} ·{" "}
                      {new Date(certificate.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <form action={downloadCertificateAction}>
                    <input
                      name="certificateId"
                      type="hidden"
                      value={certificate.id}
                    />
                    <button
                      className="border border-primary px-4 py-2 text-sm text-primary hover:bg-primary hover:text-primary-foreground"
                      type="submit"
                    >
                      Download certificate
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
