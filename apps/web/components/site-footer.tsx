import Link from "next/link"

import { ProgressThread } from "@workspace/ui/components/progress-thread"

import { BrandMark } from "@/components/brand-mark"

const footerLinks = [
  { href: "/courses", label: "Courses" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <BrandMark size="sm" />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              Structured courses, verified enrollment, and a focused place to
              keep learning.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-muted-foreground sm:flex sm:flex-wrap">
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ProgressThread className="w-16" />
          <p className="font-mono text-xs text-muted-foreground">
            © Folio, {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  )
}
