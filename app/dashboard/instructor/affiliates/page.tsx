import type {
  AffiliateDashboardResponse,
  AffiliateLinkListResponse,
  AffiliatePayoutListResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { StatTile } from "@/components/ui/stat-tile"
import { SubmitButton } from "@/components/submit-button"
import { Textarea } from "@/components/ui/textarea"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"
import { formatCurrency } from "@/lib/format"

import {
  createAffiliateLinkAction,
  requestAffiliatePayoutAction,
} from "./actions"

export const dynamic = "force-dynamic"

function money(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  return formatCurrency(value)
}

export default async function InstructorAffiliatesPage() {
  let links: AffiliateLinkListResponse["links"] = []
  let dashboard: AffiliateDashboardResponse | null = null
  let payouts: AffiliatePayoutListResponse["payouts"] = []
  let migrationPending = false
  let loadError: string | null = null

  try {
    const response = await authenticatedApiFetch<AffiliateLinkListResponse>(
      "/affiliate/links",
      { cache: "no-store" }
    )
    links = response.links ?? []
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
    else loadError = "Affiliate links could not be loaded."
  }

  try {
    dashboard = await authenticatedApiFetch<AffiliateDashboardResponse>(
      "/affiliate/dashboard",
      { cache: "no-store" }
    )
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
  }

  try {
    const response = await authenticatedApiFetch<AffiliatePayoutListResponse>(
      "/affiliate/payouts",
      { cache: "no-store" }
    )
    payouts = response.payouts ?? []
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
  }

  const stats: Array<{ label: string; value: string }> = []
  if (dashboard) {
    if (dashboard.clicks !== null && dashboard.clicks !== undefined)
      stats.push({
        label: "ট্র্যাক করা ক্লিক",
        value: String(dashboard.clicks),
      })
    if (dashboard.conversions !== null && dashboard.conversions !== undefined)
      stats.push({
        label: "কমিশন পাওয়া অর্ডার",
        value: String(dashboard.conversions),
      })
    const pending = money(dashboard.pendingCommission)
    if (pending) stats.push({ label: "মুলতুবি কমিশন", value: pending })
    const paid = money(dashboard.paidCommission)
    if (paid) stats.push({ label: "পরিশোধিত কমিশন", value: paid })
    const total = money(dashboard.totalCommission ?? dashboard.earnings)
    if (total) stats.push({ label: "মোট কমিশন", value: total })
    const balance = money(dashboard.availableBalance)
    if (balance) stats.push({ label: "উত্তোলনযোগ্য ব্যালেন্স", value: balance })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ইন্সট্রাক্টর · অ্যাফিলিয়েট"
        lede="শুধুমাত্র আপনার নিজের লিংক, কমিশন ও পেআউট। অন্য শিক্ষকের অ্যাফিলিয়েট তথ্য এখানে দেখানো হয় না।"
        title="অ্যাফিলিয়েট"
      />

      <Card>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          <h2 className="font-heading text-xl text-foreground">নিয়ম</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              নিজেকে রেফার করা যাবে না — নিজের লিংকে নিজের অর্ডারে কমিশন জমা হয়
              না।
            </li>
            <li>
              কমিশন শুধু PayConfirm-এ paid হওয়া অর্ডারের পরে জমা হবে; pending
              বা rejected অর্ডারে নয়।
            </li>
            <li>এক অর্ডারে একবারের বেশি কমিশন নয়।</li>
            <li>
              পেআউট ম্যানুয়াল অনুমোদন মাত্র — অটো পেআউট নয়। অ্যাডমিন অনুমোদন
              করলে তবেই পেমেন্ট পাঠানো হয়।
            </li>
          </ul>
        </CardContent>
      </Card>

      {migrationPending ? <MigrationNotice feature="অ্যাফিলিয়েট" /> : null}
      {loadError ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      {stats.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <StatTile key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="font-heading text-xl">নতুন লিংক তৈরি করুন</h2>
            <form action={createAffiliateLinkAction} className="mt-4 space-y-4">
              <input
                name="revalidatePath"
                type="hidden"
                value="/dashboard/instructor/affiliates"
              />
              <div className="space-y-2">
                <Label htmlFor="aff-code">কোড (ফাঁকা রাখলে সার্ভার দেবে)</Label>
                <Input id="aff-code" name="code" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aff-type">কমিশনের ধরন</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    id="aff-type"
                    name="commissionType"
                    required
                  >
                    <option value="percent">শতাংশ (%)</option>
                    <option value="flat">নির্দিষ্ট টাকা</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aff-value">কমিশনের মান</Label>
                  <Input
                    id="aff-value"
                    min={0}
                    name="commissionValue"
                    required
                    step="any"
                    type="number"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aff-scope-type">স্কোপ (ঐচ্ছিক)</Label>
                  <Input
                    id="aff-scope-type"
                    name="scopeType"
                    placeholder="course বা bundle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aff-scope-id">স্কোপ আইডি (ঐচ্ছিক)</Label>
                  <Input id="aff-scope-id" name="scopeId" />
                </div>
              </div>
              <SubmitButton>লিংক তৈরি করুন</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="font-heading text-xl">পেআউট রিকোয়েস্ট</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              অনুরোধ জমা দিলেই টাকা পাঠানো হয় না — অ্যাডমিনের ম্যানুয়াল
              অনুমোদনের পরেই পেমেন্ট হবে।
            </p>
            <form
              action={requestAffiliatePayoutAction}
              className="mt-4 space-y-4"
            >
              <input
                name="revalidatePath"
                type="hidden"
                value="/dashboard/instructor/affiliates"
              />
              <div className="space-y-2">
                <Label htmlFor="aff-payout-amount">টাকার পরিমাণ</Label>
                <Input
                  id="aff-payout-amount"
                  min={1}
                  name="amount"
                  required
                  step="any"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aff-payout-note">নোট (ঐচ্ছিক)</Label>
                <Textarea id="aff-payout-note" name="note" rows={3} />
              </div>
              <SubmitButton>পেআউট রিকোয়েস্ট পাঠান</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="space-y-3">
          <h2 className="font-heading text-xl">আমার লিংক</h2>
          {links.length === 0 ? (
            <EmptyState
              description="Create a link above and share it as ?ref=CODE on a course or bundle page."
              title="এখনও কোনো লিংক নেই"
            />
          ) : (
            links.map((link) => (
              <div
                className="rounded-xl border border-border p-4 text-sm"
                key={link.id}
              >
                <p className="font-mono font-medium">?ref={link.code}</p>
                <p className="mt-1 text-muted-foreground">
                  কমিশন:{" "}
                  {link.commissionType === "percent"
                    ? `${link.commissionValue}%`
                    : formatCurrency(link.commissionValue)}
                  {link.scopeType ? ` · স্কোপ: ${link.scopeType}` : ""}
                  {link.scopeId ? ` (${link.scopeId})` : ""}
                  {link.isReferral ? " · রেফারেল লিংক" : ""}
                </p>
                <p className="text-muted-foreground">
                  ক্লিক: {link.clicks ?? "—"} · কমিশন পাওয়া অর্ডার:{" "}
                  {link.conversions ?? "—"}
                  {link.earned !== null && link.earned !== undefined
                    ? ` · আয়: ${formatCurrency(link.earned)}`
                    : ""}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <h2 className="font-heading text-xl">পেআউট লেজার</h2>
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              এখনও কোনো পেআউট রিকোয়েস্ট নেই।
            </p>
          ) : (
            payouts.map((payout) => (
              <div
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-border p-4 text-sm"
                key={payout.id}
              >
                <span>
                  {formatCurrency(payout.amount)} · অবস্থা: {payout.status}
                  {payout.note ? ` · ${payout.note}` : ""}
                </span>
                {payout.createdAt ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    {payout.createdAt}
                  </span>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
