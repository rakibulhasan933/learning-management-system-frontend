"use client"

import { RefreshCcw } from "lucide-react"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#12151C] text-[#F2EFE7]">
        <main className="flex min-h-screen items-center justify-center px-6">
          <section className="max-w-xl">
            <p className="font-mono text-xs text-[#8B8D98]">
              Folio · System error
            </p>
            <h1 className="mt-4 font-serif text-4xl">
              The workspace needs a restart.
            </h1>
            <p className="mt-5 leading-7 text-[#8B8D98]">
              A critical error interrupted this page. Reload the application to
              continue.
            </p>
            <button
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#C9A15A] px-4 py-3 font-medium text-[#12151C]"
              onClick={reset}
            >
              <RefreshCcw className="size-4" />
              Reload page
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}
