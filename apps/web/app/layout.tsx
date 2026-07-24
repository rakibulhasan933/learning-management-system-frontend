import type { Metadata } from "next"

import "@uploadthing/react/styles.css"
import "@workspace/ui/globals.css"

export const metadata: Metadata = {
  title: "LMS",
  description: "Learning management system",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
