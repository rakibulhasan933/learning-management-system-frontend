export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-xl">
        <div className="h-px w-24 animate-pulse bg-primary" />
        <p className="mt-6 font-mono text-xs text-muted-foreground">
          Folio · Loading workspace
        </p>
        <div className="mt-4 h-10 w-3/4 animate-pulse rounded-lg bg-card" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-card" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-card" />
      </div>
    </main>
  )
}
