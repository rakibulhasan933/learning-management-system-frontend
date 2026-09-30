import type {
  AdminCouponUsageResponse,
  AdminSiteSettingsResponse,
} from "@/lib/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { CouponSettingsForm } from "./coupon-settings-form"

export const dynamic = "force-dynamic"

export default async function AdminCouponsPage() {
  const [{ settings }, usage] = await Promise.all([
    authenticatedApiFetch<AdminSiteSettingsResponse>("/admin/settings", {
      cache: "no-store",
    }),
    authenticatedApiFetch<AdminCouponUsageResponse>("/admin/coupons/usage", {
      cache: "no-store",
    }),
  ])
  return (
    <>
      <PageHeader
        eyebrow="Admin dashboard · Pricing"
        title="Coupon settings"
        lede="Add and manage student discount codes without memorizing a special format."
      />
      <Card className="mt-8 max-w-3xl">
        <CardContent>
          <CouponSettingsForm value={settings.payment_coupons ?? ""} />
        </CardContent>
      </Card>
      <section className="mt-8 grid max-w-5xl gap-4">
        <div>
          <h2 className="font-heading text-2xl">Coupon usage</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            See how many students claimed each coupon and where it was used.
          </p>
        </div>
        {usage.coupons.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">
              No coupon has been claimed yet.
            </CardContent>
          </Card>
        ) : (
          usage.coupons.map((coupon) => (
            <Card key={coupon.code}>
              <CardContent className="grid gap-4 p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg text-primary">{coupon.code}</p>
                    <p className="text-sm text-muted-foreground">
                      {coupon.active ? "Active" : "Disabled"} · {coupon.claims} claim{coupon.claims === 1 ? "" : "s"} · {coupon.limit ? `Limit ${coupon.limit}` : "Unlimited"}
                    </p>
                  </div>
                  <p className="font-mono text-sm text-muted-foreground">
                    Total discount: {coupon.totalDiscount} BDT
                    {coupon.expiresAt ? ` · Expires ${new Date(coupon.expiresAt).toLocaleString()}` : ""}
                  </p>
                </div>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Student</th>
                        <th className="px-3 py-2 font-medium">Course</th>
                        <th className="px-3 py-2 font-medium">Discount</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupon.students.map((student) => (
                        <tr className="border-b border-border last:border-0" key={student.orderId}>
                          <td className="px-3 py-3">
                            <p>{student.fullName || "Unnamed student"}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{student.courseTitle}</td>
                          <td className="px-3 py-3 font-mono text-primary">{student.discountAmount} BDT</td>
                          <td className="px-3 py-3 capitalize text-muted-foreground">{student.status.replaceAll("_", " ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </>
  )
}
