import type {
  AdminCouponUsageResponse,
  AdminSiteSettingsResponse,
} from "@/lib/types"
import {
  BadgeDollarSign,
  CheckCircle2,
  Clock3,
  TicketPercent,
  UsersRound,
} from "lucide-react"

import { authenticatedApiFetch } from "@/lib/api-client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { StatTile } from "@/components/ui/stat-tile"
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
  const activeCoupons = usage.coupons.filter((coupon) => coupon.active).length
  const claims = usage.coupons.reduce(
    (total, coupon) => total + coupon.claims,
    0
  )
  const totalDiscount = usage.coupons.reduce(
    (total, coupon) => total + Number(coupon.totalDiscount),
    0
  )

  return (
    <>
      <PageHeader
        eyebrow="Admin dashboard · Pricing"
        title="Coupon settings"
        lede="Create offers, control availability, and see exactly how each discount is performing."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          hint="currently available"
          icon={<CheckCircle2 />}
          label="Active coupons"
          tone="primary"
          value={activeCoupons}
        />
        <StatTile
          hint="across all codes"
          icon={<TicketPercent />}
          label="Coupon codes"
          value={usage.coupons.length}
        />
        <StatTile
          hint="successful redemptions"
          icon={<UsersRound />}
          label="Total claims"
          tone="secondary"
          value={claims}
        />
        <StatTile
          hint="discount granted"
          icon={<BadgeDollarSign />}
          label="Total discount"
          value={`${totalDiscount.toFixed(2)} BDT`}
        />
      </div>

      <section className="mt-8 grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
              Offer library
            </p>
            <h2 className="mt-2 font-heading text-2xl tracking-tight">
              Manage coupon codes
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Keep active offers visible and move old campaigns to the disabled
              list.
            </p>
          </div>
          <span className="rounded-full border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground">
            {usage.coupons.length} code{usage.coupons.length === 1 ? "" : "s"}{" "}
            tracked
          </span>
        </div>
        <Card className="overflow-hidden border-primary/20 bg-card/80 shadow-[0_20px_60px_-35px_rgba(214,164,72,0.45)]">
          <CardContent className="p-4 sm:p-6">
            <CouponSettingsForm value={settings.payment_coupons ?? ""} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-12 grid max-w-6xl gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-secondary uppercase">
              Redemption report
            </p>
            <h2 className="mt-2 font-heading text-2xl tracking-tight">
              Coupon usage
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              See how many students claimed each coupon and where it was used.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            Updated from paid orders
          </div>
        </div>
        {usage.coupons.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <TicketPercent className="size-8 text-muted-foreground" />
              <p className="mt-4 font-heading text-lg">
                No coupon activity yet
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Once a student uses a coupon on a paid order, its performance
                will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          usage.coupons.map((coupon) => (
            <Card className="overflow-hidden" key={coupon.code}>
              <CardContent className="p-0">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/15 p-5 sm:p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-lg font-semibold tracking-wide text-primary">
                        {coupon.code}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${coupon.active ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"}`}
                      >
                        {coupon.active ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {coupon.claims} claim{coupon.claims === 1 ? "" : "s"} ·{" "}
                      {coupon.limit ? `Limit ${coupon.limit}` : "Unlimited"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-mono text-lg text-foreground">
                      {coupon.totalDiscount} BDT
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      total discount
                      {coupon.expiresAt
                        ? ` · expires ${new Date(coupon.expiresAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
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
                        <tr
                          className="border-b border-border last:border-0 hover:bg-muted/20"
                          key={student.orderId}
                        >
                          <td className="px-3 py-3">
                            <p>{student.fullName || "Unnamed student"}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.email}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {student.courseTitle}
                          </td>
                          <td className="px-3 py-3 font-mono text-primary">
                            {student.discountAmount} BDT
                          </td>
                          <td className="px-3 py-3 text-muted-foreground capitalize">
                            {student.status.replaceAll("_", " ")}
                          </td>
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
