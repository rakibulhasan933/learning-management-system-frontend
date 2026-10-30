import type { Metadata } from "next"
import "@uploadthing/react/styles.css"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BackgroundRipple } from "@/components/background-ripple"
import { cn } from "@/lib/utils"
import { Hind_Siliguri } from "next/font/google"

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  variable: "--font-hind-siliguri",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
      data-scroll-behavior="smooth"
      className={cn("dark", "font-sans", hindSiliguri.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans antialiased">
        <TooltipProvider>
          <BackgroundRipple />
          <div className="relative z-10">{children}</div>
        </TooltipProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
