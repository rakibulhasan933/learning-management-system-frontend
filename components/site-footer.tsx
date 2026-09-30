import Link from "next/link"

import { ProgressThread } from "@/components/ui/progress-thread"

import { BrandMark } from "@/components/brand-mark"

const footerLinks = [
  { href: "/courses", label: "কোর্স" },
  { href: "/about", label: "আমাদের কথা" },
  { href: "/faq", label: "প্রশ্নোত্তর" },
  { href: "/contact", label: "যোগাযোগ" },
] as const

export function SiteFooter({ variant = "default" }: { variant?: "default" | "home" }) {
  return (
    <footer className={`mt-auto border-t border-border bg-card/60 ${variant === "home" ? "folio-home-footer" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ProgressThread className="w-full" />

        <div className="flex flex-col items-center gap-8 py-12 text-center sm:py-16">
          <BrandMark />
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            গোছানো কোর্স, যাচাইকৃত এনরোলমেন্ট, আর শেখার জন্য মনোযোগী একটি জায়গা।
          </p>

          <ProgressThread className="w-16" />

          <div className="flex flex-col items-center gap-4">
            <p className="eyebrow">ঘুরে দেখুন</p>
            <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              {footerLinks.map((link) => (
                <Link
                  className="interactive-link"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="border-t border-border py-6 text-center">
          <p className="font-mono text-xs text-muted-foreground">
            © Folio, {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  )
}
