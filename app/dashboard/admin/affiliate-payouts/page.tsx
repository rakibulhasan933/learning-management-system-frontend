import type { AffiliatePayoutListResponse } from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { SubmitButton } from "@/components/submit-button"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"
import { formatCurrency } from "@/lib/format"

import {
  approveAffiliatePayoutAction,
  markAffiliatePayoutPaidAction,
  rejectAffiliatePayoutAction,
} from "./actions"

export const dynamic = "force-dynamic"

export default async function AdminAffiliatePayoutsPage() {
  let payouts: AffiliatePayoutListResponse["payouts"] = []
  let migrationPending = false
  let loadError: string | null = null

  try {
    const response = await authenticatedApiFetch<AffiliatePayoutListResponse>(
      "/affiliate/payouts",
      { cache: "no-store" }
    )
    payouts = response.payouts ?? []
  } catch (error) {
    if (isMigrationPendingError(error)) migrationPending = true
    else loadError = "Affiliate payouts could not be loaded."
  }

  const pending = payouts.filter((payout) => payout.status === "pending")

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="অ্যাডমিন · অ্যাফিলিয়েট"
        lede="অ্যাফিলিয়েট/রেফারেল পেআউট অনুরোধ অনুমোদন, প্রত্যাখ্যান বা পরিশোধিত চিহ্নিত করুন। পেআউট ম্যানুয়াল অনুমোদন মাত্র — অটো পেআউট নয়, এবং অনুমোদন মানেই টাকা পাঠানো নয়; টাকা পাঠানোর পরেই mark-paid করুন।"
        title="অ্যাফিলিয়েট পেআউট অনুমোদন"
      />

      {migrationPending ? (
        <MigrationNotice feature="অ্যাফিলিয়েট পেআউট" />
      ) : null}
      {loadError ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-3">
          <h2 className="font-heading text-xl">
            মুলতুবি অনুরোধ ({pending.length}টি)
          </h2>
          <p className="text-sm text-muted-foreground">
            শুধু PayConfirm-এ paid অর্ডার থেকে জমা হওয়া কমিশনের পেআউট
            অনুমোদন করুন। এক অর্ডারে একবারের বেশি কমিশন দেওয়া হয় না।
          </p>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              কোনো মুলতুবি অ্যাফিলিয়েট পেআউট অনুরোধ নেই।
            </p>
          ) : (
            pending.map((payout) => (
              <div
                className="space-y-3 rounded-xl border border-border p-4"
                key={payout.id}
              >
                <p className="text-sm">
                  {formatCurrency(payout.amount)}
                  {payout.userName ? ` · ${payout.userName}` : ""}
                  {payout.note ? ` · ${payout.note}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <form action={approveAffiliatePayoutAction}>
                    <input name="payoutId" type="hidden" value={payout.id} />
                    <SubmitButton size="sm">অনুমোদন করুন</SubmitButton>
                  </form>
                  <form action={rejectAffiliatePayoutAction}>
                    <input name="payoutId" type="hidden" value={payout.id} />
                    <SubmitButton size="sm" variant="outline">
                      প্রত্যাখ্যান করুন
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <h2 className="font-heading text-xl">সব পেআউট অনুরোধ</h2>
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              এখনও কোনো অ্যাফিলিয়েট পেআউট অনুরোধ নেই।
            </p>
          ) : (
            payouts.map((payout) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 text-sm"
                key={payout.id}
              >
                <span>
                  {formatCurrency(payout.amount)} · অবস্থা: {payout.status}
                  {payout.userName ? ` · ${payout.userName}` : ""}
                  {payout.note ? ` · ${payout.note}` : ""}
                </span>
                {payout.status === "approved" ? (
                  <form action={markAffiliatePayoutPaidAction}>
                    <input name="payoutId" type="hidden" value={payout.id} />
                    <SubmitButton size="sm" variant="outline">
                      পরিশোধিত চিহ্নিত করুন
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
