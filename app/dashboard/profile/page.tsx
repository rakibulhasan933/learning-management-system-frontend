import type { ProfileDto } from "@/lib/types"

import { ImageUploadControl } from "@/components/image-upload-control"
import { authenticatedApiFetch } from "@/lib/api-client"
import { FloatingInput } from "@/components/ui/floating-input"
import { PageHeader } from "@/components/ui/page-header"
import { SubmitButton } from "@/components/submit-button"
import { UserRolePill } from "@/components/status-pill"

import { updateProfileAction } from "./actions"

export const dynamic = "force-dynamic"

// Students see Bangla, like the rest of their workspace. Staff keep English.
const copyByLanguage = {
  en: {
    eyebrow: "Profile settings",
    title: "Account details",
    lede: "Your name and photo, as other people see them on the platform.",
    unnamed: "Unnamed account",
    avatar: "Photo",
    avatarDesc: "Shown next to your activity.",
    avatarButton: "Upload photo",
    avatarHelp: "JPG, PNG, or WEBP, up to 4 MB.",
    nameLabel: "Display name",
    nameDesc: "The name other people see.",
    namePlaceholder: "Your name",
    account: "Account",
    accountDesc: "Email and role can't be changed on this page.",
    save: "Save changes",
    saving: "Saving changes...",
    upload: {
      empty: "No photo yet.",
      uploading: "Uploading...",
      ready: "Ready",
      done: "Photo uploaded. Save changes to keep it.",
      noUrl: "Upload completed, but no URL was returned.",
    },
  },
  bn: {
    eyebrow: "প্রোফাইল সেটিংস",
    title: "অ্যাকাউন্টের তথ্য",
    lede: "প্ল্যাটফর্মে অন্যরা আপনার যে নাম ও ছবি দেখেন, এখান থেকে বদলান।",
    unnamed: "নামহীন অ্যাকাউন্ট",
    avatar: "ছবি",
    avatarDesc: "আপনার কাজের পাশে দেখানো হয়।",
    avatarButton: "ছবি আপলোড করুন",
    avatarHelp: "JPG, PNG বা WEBP, সর্বোচ্চ ৪ MB।",
    nameLabel: "প্রদর্শনের নাম",
    nameDesc: "অন্যরা এই নামে আপনাকে দেখবে।",
    namePlaceholder: "আপনার নাম",
    account: "অ্যাকাউন্ট",
    accountDesc: "ইমেইল ও রোল এই পাতা থেকে বদলানো যায় না।",
    save: "পরিবর্তন সংরক্ষণ করুন",
    saving: "সংরক্ষণ হচ্ছে...",
    upload: {
      empty: "এখনো ছবি নেই।",
      uploading: "আপলোড হচ্ছে...",
      ready: "প্রস্তুত",
      done: "ছবি আপলোড হয়েছে। রাখতে হলে পরিবর্তন সংরক্ষণ করুন।",
      noUrl: "আপলোড শেষ হয়েছে, কিন্তু কোনো URL পাওয়া যায়নি।",
    },
  },
} as const

function Row({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-4 p-5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-8 sm:p-6">
      <div>
        <h2 className="font-medium">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export default async function DashboardProfilePage() {
  const profile = await authenticatedApiFetch<ProfileDto>("/auth/me", {
    cache: "no-store",
  })
  const t = copyByLanguage[profile.role === "student" ? "bn" : "en"]

  return (
    <>
      <PageHeader eyebrow={t.eyebrow} lede={t.lede} title={t.title} />

      <form
        action={updateProfileAction}
        className="mt-8 max-w-3xl overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="divide-y divide-border">
          <Row description={t.avatarDesc} title={t.avatar}>
            <ImageUploadControl
              buttonLabel={t.avatarButton}
              currentUrl={profile.avatarUrl}
              helpText={t.avatarHelp}
              inputName="avatarUrl"
              label={t.avatar}
              labels={t.upload}
              purpose="avatar"
              showFormatHint={false}
            />
          </Row>

          <Row description={t.nameDesc} title={t.nameLabel}>
            <FloatingInput
              defaultValue={profile.fullName ?? ""}
              label={t.nameLabel}
              name="fullName"
              placeholder={t.namePlaceholder}
            />
          </Row>

          <Row description={t.accountDesc} title={t.account}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium break-words">
                  {profile.fullName ?? t.unnamed}
                </p>
                <p className="text-sm break-words text-muted-foreground">
                  {profile.email}
                </p>
              </div>
              <UserRolePill role={profile.role} />
            </div>
          </Row>
        </div>

        <div className="flex border-t border-border bg-background/40 px-5 py-4 sm:justify-end sm:px-6">
          <SubmitButton className="w-full sm:w-fit" pendingLabel={t.saving}>
            {t.save}
          </SubmitButton>
        </div>
      </form>
    </>
  )
}
