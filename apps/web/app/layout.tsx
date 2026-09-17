import type { Metadata } from "next"

import "@uploadthing/react/styles.css"
import "@workspace/ui/globals.css"

export const metadata: Metadata = {
  title: { default: "LMS — A new chapter in learning", template: "%s | LMS" },
  description:
    "Explore thoughtful courses, build practical skills, and make progress at your own pace. Your next chapter starts with LMS.",
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
