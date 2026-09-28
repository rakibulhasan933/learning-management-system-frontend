import type { AdminSiteSettingsResponse } from "@workspace/types"

import { updateAdminSettingsAction } from "@/app/dashboard/admin/actions"
import { authenticatedApiFetch } from "@/lib/api-client"
import { SubmitButton } from "@/components/submit-button"
import { PageHeader } from "@workspace/ui/components/page-header"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Textarea } from "@workspace/ui/components/textarea"

export const dynamic = "force-dynamic"

export default async function AdminCouponsPage() {
  const { settings } = await authenticatedApiFetch<AdminSiteSettingsResponse>(
    "/admin/settings",
    { cache: "no-store" }
  )
  return (
    <>
      <PageHeader
        eyebrow="Admin dashboard · Pricing"
        title="Coupon settings"
        lede="Manage the coupon codes students can apply before payment. Changes are validated by the backend."
      />
      <Card className="mt-8 max-w-3xl">
        <CardContent>
          <form action={updateAdminSettingsAction} className="grid gap-5">
            <div>
              <label
                className="text-sm text-muted-foreground"
                htmlFor="payment_coupons"
              >
                Active coupons
              </label>
              <Textarea
                className="mt-2 min-h-32 font-mono text-sm"
                defaultValue={settings.payment_coupons ?? ""}
                id="payment_coupons"
                name="payment_coupons"
                placeholder="WELCOME10:percent:10,FLAT500:amount:500"
              />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Format: <code>CODE:percent:10</code> or{" "}
                <code>CODE:amount:500</code>. Separate multiple codes with
                commas.
              </p>
            </div>
            <SubmitButton pendingLabel="Saving...">
              Save coupon settings
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
