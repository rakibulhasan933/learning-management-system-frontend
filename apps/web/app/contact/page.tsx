import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Mail, MessageCircle } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { ProgressThread } from "@workspace/ui/components/progress-thread"

export const metadata: Metadata = { title: "Contact support", description: "Contact Folio support about payments, course access and account issues." }
export default function ContactPage() { const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@folio.example.com"; return <main className="min-h-screen bg-background text-foreground"><SiteHeader /><section className="mx-auto max-w-5xl px-6 py-14 sm:py-20"><Button asChild className="mb-10" variant="outline"><Link href="/"><ArrowLeft className="size-4" />Home</Link></Button><ProgressThread className="mb-8 w-24" /><p className="font-mono text-xs text-muted-foreground">Support · Contact</p><h1 className="mt-3 max-w-2xl font-heading text-5xl tracking-tight">Let’s solve it together.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">For payment, enrollment or account help, send the relevant order/reference code and the email used on your account.</p><div className="mt-10 grid gap-5 md:grid-cols-2"><Card><CardContent><Mail className="size-5 text-primary" /><h2 className="mt-5 font-heading text-2xl">Email support</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Best for payment verification and account-specific questions.</p><Button asChild className="mt-6"><a href={`mailto:${email}`}>{email}</a></Button></CardContent></Card><Card><CardContent><MessageCircle className="size-5 text-primary" /><h2 className="mt-5 font-heading text-2xl">Before you write</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Include your account email, course title, order/reference code and a short description of the issue.</p><Button asChild className="mt-6" variant="outline"><Link href="/faq">Read the FAQ</Link></Button></CardContent></Card></div></section></main> }
