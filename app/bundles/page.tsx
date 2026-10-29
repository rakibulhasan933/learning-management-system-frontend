import { Suspense } from "react"
import Link from "next/link"

import type { BundleListResponse } from "@/lib/types"
import {
  ApiClientError,
  publicApiFetch,
} from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { ProgressThread } from "@/components/ui/progress-thread"
import { PublicShell } from "@/components/public-shell"
import { RefCapture } from "@/components/ref-capture"
import {
  MigrationNotice,
  isMigrationPendingError,
} from "@/components/migration-notice"
import { formatPrice } from "@/lib/format"

import { BundleBuyButton, BundleSubscribeForm } from "./bundle-actions"

export const dynamic = "force-dynamic"

export default async function BundlesPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>
}) {
  const params = (await searchParams) ?? {}
  let bundles: BundleListResponse["bundles"] = []
  let migrationPending = params.error === "migration_pending"
  let loadError: string | null = null

  try {
    const response = await publicApiFetch<BundleListResponse>("/bundles", {
      cache: "no-store",
    })
    bundles = response.bundles
  } catch (error) {
    if (isMigrationPendingError(error)) {
      migrationPending = true
    } else {
      loadError =
        error instanceof ApiClientError
          ? error.message
          : "Bundles could not be loaded."
    }
  }

  return (
    <PublicShell>
      <Suspense fallback={null}>
        <RefCapture />
      </Suspense>
      <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
        <section className="mx-auto max-w-5xl">
          <ProgressThread className="mb-8" />
          <PageHeader
            eyebrow="বান্ডেল"
            lede="একসাথে একাধিক কোর্স — একটি অর্ডারে, বিদ্যমান PayConfirm প্রমাণ ফ্লোতে পেমেন্ট যাচাই হবে।"
            title="কোর্স বান্ডেল"
          />
          {migrationPending ? (
            <MigrationNotice feature="বান্ডেল" />
          ) : loadError ? (
            <p className="mt-8 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
              বান্ডেল তালিকা এখন লোড করা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।
            </p>
          ) : bundles.length === 0 ? (
            <EmptyState
              className="mt-12"
              description="Published bundles will appear here."
              title="এখনও কোনো বান্ডেল নেই"
            />
          ) : (
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {bundles.map((bundle) => (
                <Card key={bundle.id}>
                  <CardContent className="space-y-4">
                    <div>
                      <h2 className="font-heading text-2xl">{bundle.title}</h2>
                      {bundle.description ? (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {bundle.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="font-mono text-sm text-muted-foreground">
                      {bundle.courseIds.length}টি কোর্স
                      {bundle.durationDays
                        ? ` · ${bundle.durationDays} দিনের অ্যাক্সেস`
                        : ""}
                    </p>
                    <p className="text-lg">
                      {formatPrice(bundle.price, bundle.currency)}
                      {bundle.originalPrice ? (
                        <span className="ml-2 text-sm text-muted-foreground line-through">
                          {formatPrice(bundle.originalPrice, bundle.currency)}
                        </span>
                      ) : null}
                    </p>
                    <BundleBuyButton bundleId={bundle.id} />
                    <BundleSubscribeForm bundleId={bundle.id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/courses">একক কোর্স দেখুন</Link>
            </Button>
          </div>
        </section>
      </main>
    </PublicShell>
  )
}
