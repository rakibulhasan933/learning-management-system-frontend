import type { Metadata } from "next"
import { Figtree } from "next/font/google"

import "@uploadthing/react/styles.css"
import "@workspace/ui/globals.css"

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Folio — Learning management, verified",
  description:
    "A ledger-precise LMS for admins, instructors, and students: manual payment verification, course progress, and secure video in one workspace.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${figtree.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <main>{children}</main>
      </body>
    </html>
  )
}