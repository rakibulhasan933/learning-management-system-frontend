import Image from "next/image"
import type { ProfileDto } from "@workspace/types"

import { ImageUploadControl } from "@/components/image-upload-control"
import { authenticatedApiFetch } from "@/lib/api-client"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { FloatingInput } from "@workspace/ui/components/floating-input"

import { updateProfileAction } from "./actions"

export const dynamic = "force-dynamic"

export default async function DashboardProfilePage() {
  const profile = await authenticatedApiFetch<ProfileDto>("/auth/me", {
    cache: "no-store",
  })

  const initials = profile.fullName?.trim()?.[0] ?? profile.email[0] ?? "U"

  return (
    <main className="min-h-screen bg-[#12151C] px-4 py-8 text-[#F2EFE7] sm:px-6 sm:py-10">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 h-px w-28 bg-[#C9A15A]" />
        <p className="font-mono text-sm text-[#8B8D98]">Profile settings</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl tracking-tight sm:text-4xl">Account details</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8B8D98]">
              Update your display name and avatar. Avatar images are uploaded
              through UploadThing and saved to your backend-owned profile
              record.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Card className="border-[#2A2F3A] bg-[#1B1F29]">
            <CardContent className="p-5">
              <div className="relative mx-auto aspect-square w-32 overflow-hidden border border-[#2A2F3A] bg-[#12151C] sm:w-40">
                {profile.avatarUrl ? (
                  <Image
                    alt={profile.fullName ?? profile.email}
                    className="object-cover"
                    fill
                    sizes="160px"
                    src={profile.avatarUrl}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl text-[#C9A15A]">
                    {initials.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="mt-5 border-t border-[#2A2F3A] pt-4">
                <p className="text-sm text-[#8B8D98]">Signed in as</p>
                <p className="mt-1 break-words text-sm text-[#F2EFE7]">
                  {profile.email}
                </p>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-[#8B8D98]">
                  {profile.role} workspace
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#2A2F3A] bg-[#1B1F29]">
            <CardContent className="grid gap-5 p-5">
              <form action={updateProfileAction} className="grid gap-5">
                <FloatingInput
                  defaultValue={profile.fullName ?? ""}
                  label="Display name"
                  name="fullName"
                  placeholder="Your name"
                />

                <div className="grid gap-4">
                  <ImageUploadControl
                    buttonLabel="Upload avatar"
                    currentUrl={profile.avatarUrl}
                    helpText="Upload a JPG, PNG, or WEBP image up to 4 MB. The image is linked to your profile."
                    inputName="avatarUrl"
                    label="Avatar image"
                    purpose="avatar"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button className="w-full sm:w-fit" type="submit">
                    Save changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
