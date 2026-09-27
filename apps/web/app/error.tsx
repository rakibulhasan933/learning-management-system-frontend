"use client"

import Link from "next/link"
import { RefreshCcw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ProgressThread } from "@workspace/ui/components/progress-thread"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground"><section className="w-full max-w-xl"><ProgressThread className="mb-8 w-24" /><p className="font-mono text-xs text-muted-foreground">Error · Temporary interruption</p><h1 className="mt-4 font-heading text-4xl tracking-tight sm:text-5xl">Something went wrong.</h1><p className="mt-5 text-base leading-7 text-muted-foreground">This page could not finish loading. Try again, or return to the home page.</p><div className="mt-8 flex flex-wrap gap-3"><Button onClick={reset}><RefreshCcw className="size-4" />Try again</Button><Button asChild variant="outline"><Link href="/">Back home</Link></Button></div></section></main>
}
