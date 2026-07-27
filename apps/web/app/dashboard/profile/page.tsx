import Image from "next/image"
import { ShieldCheck } from "lucide-react"
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
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 h-px w-28 bg-primary" />
        <p className="font-mono text-sm text-muted-foreground">
          Profile settings
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
              Account details
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Update your display name and avatar. Avatar images are uploaded
              through UploadThing and saved to your backend-owned profile
              record.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <div className="relative mx-auto aspect-square w-32 overflow-hidden rounded-full border-2 border-primary/40 bg-background ring-4 ring-primary/10 sm:w-40">
                {profile.avatarUrl ? (
                  <Image
                    alt={profile.fullName ?? profile.email}
                    className="object-cover"
                    fill
                    sizes="160px"
                    src={profile.avatarUrl}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-primary/10 text-4xl font-heading text-primary">
                    {initials.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="mt-1 break-words text-sm text-foreground">
                  {profile.email}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  {profile.role} workspace
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
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

                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <Button
                    className="w-full transition-opacity hover:opacity-90 sm:w-fit"
                    type="submit"
                  >
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