import type { Metadata } from "next"
import {
  Fraunces,
  Hind_Siliguri,
  IBM_Plex_Mono,
  Inter,
  Noto_Serif_Bengali,
} from "next/font/google"

import "@uploadthing/react/styles.css"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

// English / Latin fonts (unchanged)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-src",
})

const fraunces = Fraunces({
  axes: ["SOFT", "WONK", "opsz"],
  subsets: ["latin"],
  variable: "--font-display-src",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono-src",
  weight: ["400", "500", "600"],
})

// Bengali fallbacks: Fraunces and Inter have no Bengali glyphs,
// so Bengali text uses these automatically.
const bnSans = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  variable: "--font-bn-sans-src",
  weight: ["300", "400", "500", "600"],
})

const bnSerif = Noto_Serif_Bengali({
  subsets: ["bengali", "latin"],
  variable: "--font-bn-display-src",
  weight: ["300", "400", "500"],
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://folio.example.com"
  ),
  title: {
    default: "Folio — বাংলাদেশের অনলাইন কোর্স",
    template: "%s | Folio",
  },
  description:
    "সাজানো কোর্স, bKash ও Nagad এ তাৎক্ষণিক পেমেন্ট, অনার্স শিক্ষার্থীদের জন্য সাজেস্টেড কোর্স এবং সুরক্ষিত ভিডিও ক্লাস।",
  keywords: [
    "অনলাইন কোর্স",
    "অনার্স কোর্স",
    "বাংলাদেশ",
    "online learning",
    "secure video learning",
  ],
  openGraph: {
    description:
      "বাংলাদেশের শিক্ষার্থীদের জন্য তাৎক্ষণিক পেমেন্ট ও সুরক্ষিত ভিডিওসহ অনলাইন কোর্স।",
    locale: "bn_BD",
    siteName: "Folio",
    title: "Folio — বাংলাদেশের অনলাইন কোর্স",
    type: "website",
  },
  robots: {
    follow: true,
    index: true,
  },
  twitter: {
    card: "summary_large_image",
    description: "তাৎক্ষণিক পেমেন্ট ও সুরক্ষিত ভিডিওসহ অনলাইন কোর্স।",
    title: "Folio — বাংলাদেশের অনলাইন কোর্স",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="bn"
      className={`dark ${inter.variable} ${fraunces.variable} ${ibmPlexMono.variable} ${bnSans.variable} ${bnSerif.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}