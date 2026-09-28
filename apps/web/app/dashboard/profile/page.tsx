import Image from "next/image"
import type { ProfileDto } from "@workspace/types"

import { ImageUploadControl } from "@/components/image-upload-control"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@workspace/ui/components/card"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import { PageHeader } from "@workspace/ui/components/page-header"
import { SubmitButton } from "@/components/submit-button"
import { UserRolePill } from "@/components/status-pill"

import { updateProfileAction } from "./actions"

export const dynamic = "force-dynamic"

export default async function DashboardProfilePage() {
  const profile = await authenticatedApiFetch<ProfileDto>("/auth/me", {
    cache: "no-store",
  })

  const initials = profile.fullName?.trim()?.[0] ?? profile.email[0] ?? "U"

  return (
    <>
      <PageHeader
        eyebrow="Profile settings"
        lede="Update your display name and avatar. Avatar images are uploaded through UploadThing and saved to your backend-owned profile record."
        title="Account details"
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        {/* Identity card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col items-center gap-4 bg-gradient-to-b from-primary/5 to-transparent px-6 pt-8 pb-6">
              <div className="group relative aspect-square w-32 overflow-hidden rounded-full bg-background ring-2 ring-primary/30 transition-all duration-300 hover:ring-primary/60 sm:w-40">
                {profile.avatarUrl ? (
                  <Image
                    alt={profile.fullName ?? profile.email}
                    className="object-cover"
                    fill
                    sizes="160px"
                    src={profile.avatarUrl}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 font-heading text-4xl text-primary">
                    {initials.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="font-heading text-lg tracking-tight">
                  {profile.fullName ?? "Unnamed account"}
                </p>
                <p className="mt-0.5 font-mono text-xs break-words text-muted-foreground">
                  {profile.email}
                </p>
              </div>

              <UserRolePill role={profile.role} />
            </div>
          </CardContent>
        </Card>

        {/* Editable form */}
        <Card>
          <CardContent>
            <form action={updateProfileAction} className="grid gap-6">
              <div>
                <p className="font-mono text-xs tracking-wide text-muted-foreground">
                  Public identity
                </p>
                <h2 className="mt-2 font-heading text-2xl tracking-tight">
                  Name and avatar
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  This is what other people on the platform see next to your
                  activity.
                </p>
              </div>

              <div className="grid gap-5 border-t border-border pt-6">
                <FloatingInput
                  defaultValue={profile.fullName ?? ""}
                  label="Display name"
                  name="fullName"
                  placeholder="Your name"
                />

                <ImageUploadControl
                  buttonLabel="Upload avatar"
                  currentUrl={profile.avatarUrl}
                  helpText="Upload a JPG, PNG, or WEBP image up to 4 MB. The image is linked to your profile."
                  inputName="avatarUrl"
                  label="Avatar image"
                  purpose="avatar"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
                <SubmitButton
                  className="w-full sm:w-fit"
                  pendingLabel="Saving changes..."
                >
                  Save changes
                </SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
