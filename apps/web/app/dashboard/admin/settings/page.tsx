import type { AdminSiteSettingsResponse } from "@workspace/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { updateAdminSettingsAction } from "@/app/dashboard/admin/actions"
import { PageHeader } from "@workspace/ui/components/page-header"
import { Card, CardContent } from "@workspace/ui/components/card"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import { Textarea } from "@workspace/ui/components/textarea"
import { SubmitButton } from "@/components/submit-button"

export const dynamic = "force-dynamic"
export default async function AdminSettingsPage() {
  const { settings } = await authenticatedApiFetch<AdminSiteSettingsResponse>("/admin/settings", { cache: "no-store" })
  const value = (key: string) => settings[key] ?? ""
  return <><PageHeader eyebrow="Admin dashboard · Configuration" title="Site settings" lede="Manage public branding, support contacts and payment instructions." /><Card className="mt-8"><CardContent><form action={updateAdminSettingsAction} className="grid gap-5 md:grid-cols-2"><FloatingInput label="Site name" name="site_name" defaultValue={value("site_name")} /><FloatingInput label="Logo URL" name="logo_url" defaultValue={value("logo_url")} /><FloatingInput label="bKash number" name="payment_bkash_number" defaultValue={value("payment_bkash_number")} /><FloatingInput label="Nagad number" name="payment_nagad_number" defaultValue={value("payment_nagad_number")} /><FloatingInput label="Rocket number" name="payment_rocket_number" defaultValue={value("payment_rocket_number")} /><FloatingInput label="Support phone" name="support_phone" defaultValue={value("support_phone")} /><FloatingInput label="Support email" name="support_email" defaultValue={value("support_email")} /><div className="md:col-span-2"><Textarea name="payment_instructions" defaultValue={value("payment_instructions")} placeholder="Payment instructions" /></div><div className="md:col-span-2"><SubmitButton pendingLabel="Saving...">Save settings</SubmitButton></div></form></CardContent></Card></>
}
