import Link from "next/link"
import type {
  AffiliateDashboardResponse,
  AffiliateLinkListResponse,
  AffiliatePayoutListResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
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
  createReferralLinkAction,
  requestReferralPayoutAction,
} from "./actions"

export const dynamic = "force-dynamic"

export default async function StudentReferralsPage() {
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
    else loadError = "Referral links could not be loaded."
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

  const referralLinks = links.filter((link) => link.isReferral !== false)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="শিক্ষার্থী · রেফারেল"
        lede="আপনার রেফারেল লিংক শেয়ার করুন। বন্ধু সেই লিংকে কোর্স/বান্ডেল কিনে PayConfirm-এ paid হলে তবেই কমিশন জমা হবে।"
        title="আমার রেফারেল"
      />

      <Card>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          <h2 className="font-heading text-xl text-foreground">নিয়ম</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>নিজেকে রেফার করা যাবে না — নিজের লিংকে নিজের অর্ডারে কমিশন জমা হয় না।</li>
            <li>কমিশন শুধু PayConfirm-এ paid হওয়া অর্ডারের পরে জমা হবে।</li>
            <li>এক অর্ডারে একবারের বেশি কমিশন নয়।</li>
            <li>পেআউট ম্যানুয়াল অনুমোদন মাত্র — অটো পেআউট নয়।</li>
          </ul>
        </CardContent>
      </Card>

      {migrationPending ? (
        <MigrationNotice feature="রেফারেল" />
      ) : null}
      {loadError ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      {dashboard ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="ট্র্যাক করা ক্লিক"
            value={String(dashboard.clicks ?? "—")}
          />
          <StatTile
            label="কমিশন পাওয়া অর্ডার"
            value={String(dashboard.conversions ?? "—")}
          />
          <StatTile
            label="মুলতুবি কমিশন"
            value={
              dashboard.pendingCommission !== null &&
              dashboard.pendingCommission !== undefined
                ? formatCurrency(dashboard.pendingCommission)
                : "—"
            }
          />
          <StatTile
            label="পরিশোধিত কমিশন"
            value={
              dashboard.paidCommission !== null &&
              dashboard.paidCommission !== undefined
                ? formatCurrency(dashboard.paidCommission)
                : "—"
            }
          />
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="font-heading text-xl">নতুন রেফারেল লিংক</h2>
            <form action={createReferralLinkAction} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ref-code">কোড (ফাঁকা রাখলে সার্ভার দেবে)</Label>
                <Input id="ref-code" name="code" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ref-type">কমিশনের ধরন</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    id="ref-type"
                    name="commissionType"
                    required
                  >
                    <option value="percent">শতাংশ (%)</option>
                    <option value="flat">নির্দিষ্ট টাকা</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ref-value">কমিশনের মান</Label>
                  <Input
                    id="ref-value"
                    min={0}
                    name="commissionValue"
                    required
                    step="any"
                    type="number"
                  />
                </div>
              </div>
              <SubmitButton>রেফারেল লিংক তৈরি করুন</SubmitButton>
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
              action={requestReferralPayoutAction}
              className="mt-4 space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="ref-payout-amount">টাকার পরিমাণ</Label>
                <Input
                  id="ref-payout-amount"
                  min={1}
                  name="amount"
                  required
                  step="any"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref-payout-note">নোট (ঐচ্ছিক)</Label>
                <Textarea id="ref-payout-note" name="note" rows={3} />
              </div>
              <SubmitButton>পেআউট রিকোয়েস্ট পাঠান</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="space-y-3">
          <h2 className="font-heading text-xl">আমার রেফারেল লিংক</h2>
          {referralLinks.length === 0 ? (
            <EmptyState
              description="Create a referral link above and share it as ?ref=CODE on a course or bundle page."
              title="এখনও কোনো রেফারেল লিংক নেই"
            />
          ) : (
            referralLinks.map((link) => (
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
                  {" · "}ক্লিক: {link.clicks ?? "—"}
                  {" · "}কমিশন পাওয়া অর্ডার: {link.conversions ?? "—"}
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

      <Button asChild variant="outline">
        <Link href="/courses">কোর্স দেখুন</Link>
      </Button>
    </div>
  )
}
