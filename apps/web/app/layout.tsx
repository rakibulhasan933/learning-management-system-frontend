import type { Metadata } from "next"

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
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
