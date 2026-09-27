import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { Button } from "@workspace/ui/components/button"
import { ProgressThread } from "@workspace/ui/components/progress-thread"

export const metadata = { title: "Page not found" }

export default function NotFound() {
  return <main className="min-h-screen bg-background text-foreground"><SiteHeader /><section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-3xl flex-col justify-center px-6 py-20"><ProgressThread className="mb-8 w-24" /><p className="font-mono text-xs text-muted-foreground">Error 404 · Missing route</p><h1 className="mt-4 font-heading text-5xl tracking-tight sm:text-7xl">This page is off the ledger.</h1><p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">The page may have moved, or the link may be incomplete. Choose a known workspace and continue.</p><div className="mt-9 flex flex-wrap gap-3"><Button asChild><Link href="/"><ArrowLeft className="size-4" />Back home</Link></Button><Button asChild variant="outline"><Link href="/courses"><Search className="size-4" />Browse courses</Link></Button></div></section></main>
}
