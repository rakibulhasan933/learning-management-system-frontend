import type { Metadata } from "next"
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google"

import "@uploadthing/react/styles.css"
import "@workspace/ui/globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fraunces = Fraunces({
  axes: ["SOFT", "WONK", "opsz"],
  subsets: ["latin"],
  variable: "--font-display",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://folio.example.com"),
  title: {
    default: "Folio — Verified online learning",
    template: "%s | Folio",
  },
  description:
    "A ledger-precise LMS for admins, instructors, and students: manual payment verification, course progress, and secure video in one workspace.",
  keywords: ["online learning", "learning management system", "courses", "secure video learning"],
  openGraph: {
    description: "Verified online learning with structured courses, secure video, progress tracking, and trusted payments.",
    locale: "en_US",
    siteName: "Folio",
    title: "Folio — Verified online learning",
    type: "website",
  },
  robots: {
    follow: true,
    index: true,
  },
  twitter: {
    card: "summary_large_image",
    description: "Verified online learning with secure courses and tracked progress.",
    title: "Folio — Verified online learning",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${fraunces.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <main>{children}</main>
      </body>
    </html>
  )
}
