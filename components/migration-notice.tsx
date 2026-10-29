import { Card, CardContent } from "@/components/ui/card"

/**
 * Shown when the backend answers 503 because the new tables for
 * bundles / subscriptions / instalments / question bank / model tests
 * exist in the Drizzle schema but no migration has been applied yet.
 * Never render fake data in place of the missing feature.
 */
export function MigrationNotice({ feature }: { feature: string }) {
  return (
    <Card className="mt-8">
      <CardContent className="space-y-2">
        <h2 className="font-heading text-xl">{feature} এখনও চালু হয়নি</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          এই ফিচারটি চালু করতে ডেটাবেস মাইগ্রেশন বাকি আছে। মাইগ্রেশন প্রয়োগ
          হলে এই পাতাটি স্বয়ংক্রিয়ভাবে কাজ করবে। কোনো তথ্য অনুমান করে
          দেখানো হচ্ছে না।
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          This feature is waiting on a database migration. Nothing here is
          estimated or invented while the backend reports the table as
          missing.
        </p>
      </CardContent>
    </Card>
  )
}

export function isMigrationPendingError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 503
  )
}
