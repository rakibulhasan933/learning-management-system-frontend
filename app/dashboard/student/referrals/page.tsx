import Link from "next/link"
import type {
  AffiliateDashboardResponse,
  AffiliateLinkListResponse,
  AffiliatePayoutListResponse,
} from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
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

const bn = (n: number) => n.toLocaleString("bn-BD")
const panel = "rounded-xl border border-border bg-card p-5 sm:p-6"
const h2 = "text-xl font-semibold"
const selectCls =
  "min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"

// Unknown statuses fall back to the raw value.
const payoutStatus: Record<string, string> = {
  pending: "মুলতুবি",
  approved: "অনুমোদিত",
  paid: "পরিশোধিত",
  rejected: "বাতিল",
}

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
    else loadError = "রেফারেল লিংক লোড করা যায়নি।"
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
  const num = (value: number | null | undefined) =>
    value !== null && value !== undefined ? bn(value) : "—"
  const money = (value: number | string | null | undefined) =>
    value !== null && value !== undefined ? formatCurrency(Number(value)) : "—"

  const stats = dashboard
    ? [
        ["ট্র্যাক করা ক্লিক", num(dashboard.clicks)],
        ["কমিশন পাওয়া অর্ডার", num(dashboard.conversions)],
        ["মুলতুবি কমিশন", money(dashboard.pendingCommission)],
        ["পরিশোধিত কমিশন", money(dashboard.paidCommission)],
      ]
    : []

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="শিক্ষার্থী · রেফারেল"
        lede="আপনার রেফারেল লিংক শেয়ার করুন। বন্ধু সেই লিংকে কোর্স বা বান্ডেল কিনে PayConfirm-এ paid হলে তবেই কমিশন জমা হবে।"
        title="আমার রেফারেল"
      />

      {migrationPending ? <MigrationNotice feature="রেফারেল" /> : null}
      {loadError ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      {stats.length > 0 ? (
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <div className="bg-card p-5" key={label}>
              <dd className="order-2 text-2xl font-semibold tabular-nums sm:text-3xl">
                {value}
              </dd>
              <dt className="mt-1 text-sm text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>
      ) : null}

      <section className="grid items-start gap-4 lg:grid-cols-2">
        <div className={panel}>
          <h2 className={h2}>নতুন রেফারেল লিংক</h2>
          <form action={createReferralLinkAction} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ref-code">কোড (ফাঁকা রাখলে সার্ভার দেবে)</Label>
              <Input id="ref-code" name="code" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ref-type">কমিশনের ধরন</Label>
                <select
                  className={selectCls}
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
        </div>

        <div className={panel}>
          <h2 className={h2}>পেআউট রিকোয়েস্ট</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            অনুরোধ জমা দিলেই টাকা পাঠানো হয় না। অ্যাডমিনের ম্যানুয়াল অনুমোদনের
            পরেই পেমেন্ট হবে।
          </p>
          <form action={requestReferralPayoutAction} className="mt-4 space-y-4">
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
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">আমার রেফারেল লিংক</h2>
        {referralLinks.length === 0 ? (
          <EmptyState
            description="উপরে রেফারেল লিংক তৈরি করুন, তারপর কোর্স বা বান্ডেল পেজের লিংকের শেষে ?ref=কোড যোগ করে শেয়ার করুন।"
            title="এখনও কোনো রেফারেল লিংক নেই"
          />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {referralLinks.map((link) => (
              <li
                className="grid gap-1 px-5 py-4 text-sm sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-6"
                key={link.id}
              >
                <p className="font-mono text-base font-semibold break-all">
                  ?ref={link.code}
                </p>
                <p className="text-muted-foreground">
                  কমিশন:{" "}
                  {link.commissionType === "percent"
                    ? `${link.commissionValue}%`
                    : formatCurrency(link.commissionValue)}
                  {" · "}ক্লিক: {num(link.clicks)}
                  {" · "}কমিশন পাওয়া অর্ডার: {num(link.conversions)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">পেআউট লেজার</h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            এখনও কোনো পেআউট রিকোয়েস্ট নেই।
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {payouts.map((payout) => (
              <li
                className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 text-sm"
                key={payout.id}
              >
                <span>
                  <strong className="text-base">
                    {formatCurrency(payout.amount)}
                  </strong>
                  {" · "}
                  {payoutStatus[payout.status] ?? payout.status}
                  {payout.note ? ` · ${payout.note}` : ""}
                </span>
                {payout.createdAt ? (
                  <span className="text-muted-foreground">
                    {payout.createdAt}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border p-5 sm:p-6">
        <h2 className="font-semibold">নিয়ম</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
          <li>
            নিজেকে রেফার করা যাবে না। নিজের লিংকে নিজের অর্ডারে কমিশন জমা হয়
            না।
          </li>
          <li>কমিশন শুধু PayConfirm-এ paid হওয়া অর্ডারের পরে জমা হবে।</li>
          <li>এক অর্ডারে একবারের বেশি কমিশন নয়।</li>
          <li>পেআউট ম্যানুয়াল অনুমোদন মাত্র, অটো পেআউট নয়।</li>
        </ul>
        <Link
          className="mt-4 inline-flex min-h-12 items-center rounded-lg border border-border px-5 font-semibold transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-primary"
          href="/courses"
        >
          কোর্স দেখুন
        </Link>
      </section>
    </div>
  )
}
