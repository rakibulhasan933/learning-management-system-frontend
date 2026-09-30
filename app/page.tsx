import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, ShieldCheck } from "lucide-react"
import type { CourseListResponse, ProfileDto } from "@/lib/types"

import { PublicShell } from "@/components/public-shell"
import { authenticatedApiFetch, publicApiFetch } from "@/lib/api-client"
import { getDashboardPath } from "@/lib/auth/dashboard"

const paymentMethods = [["bKash", "Send Money"], ["Nagad", "Send Money"], ["Rocket", "Send Money"], ["ব্যাংক ট্রান্সফার", ""]]
const stats = [["১০০%", "হাতে যাচাই করা পেমেন্ট"], ["TrxID সহ রেকর্ড", "প্রতি এনরোলমেন্টে ১টি"], ["সুরক্ষিত", "ডাউনলোড-নিরাপদ ভিডিও ক্লাস"]]
const categories = [["ফ্রিল্যান্সিং ও আইটি", "ওয়েব, ডিজাইন, ডিজিটাল মার্কেটিং। আন্তর্জাতিক মার্কেটপ্লেসের জন্য তৈরি হন."], ["ভর্তি ও একাডেমিক", "HSC, বিশ্ববিদ্যালয় ভর্তি ও বিষয়ভিত্তিক কোর্স, ধাপে ধাপে সাজানো."], ["চাকরি ও BCS প্রস্তুতি", "সিলেবাস অনুযায়ী ক্লাস, মডেল টেস্ট ও প্রগ্রেস ট্র্যাকিং."], ["ভাষা ও ক্যারিয়ার", "IELTS, স্পোকেন ইংলিশ, CV ও ইন্টারভিউ প্রস্তুতি."]]
const steps = [["ধাপ ১", "কোর্স বেছে নিন", "দাম শুরু থেকেই টাকায় দেখা যাবে, লুকানো চার্জ নেই."], ["ধাপ ২", "কুপন দিন", "সক্রিয় কোড বসালে চূড়ান্ত টাকার অঙ্ক দেখতে পাবেন."], ["ধাপ ৩", "bKash / Nagad এ পাঠান", "অর্ডারে দেখানো নম্বরে ঠিক ওই অঙ্ক পাঠিয়ে TrxID জমা দিন."], ["ধাপ ৪", "যাচাইয়ের পর ক্লাস চালু", "পেমেন্ট যাচাই হলেই কোর্স খুলে যায়, ফোনে বা ল্যাপটপে."]]
const faqs = [["কখন কোর্সে ঢুকতে পারব?", "পেমেন্ট যাচাই হওয়ার পর। যাচাই না হওয়া পর্যন্ত অর্ডার পেন্ডিং থাকে এবং কোর্স লক থাকে."], ["bKash বা Nagad এ পেমেন্ট করলে কীভাবে যাচাই হয়?", "অ্যাপের বাইরে পেমেন্ট করে TrxID ও সময় জমা দেবেন। আমাদের টিম মিলিয়ে দেখে অর্ডার Paid করলে অ্যাক্সেস খোলে."], ["ভুল অঙ্ক পাঠিয়ে ফেললে কী হবে?", "সাপোর্টে অর্ডার নম্বর ও TrxID পাঠান। আমরা ঘাটতি বা অতিরিক্ত অঙ্ক মিটিয়ে দেব."], ["কুপন কি চেকআউটেই দিতে হবে?", "হ্যাঁ। পেমেন্টের আগে কুপন দিন, তাহলে অর্ডারে ছাড়ের পরের অঙ্ক লেখা থাকবে."]]

function formatPrice(currency: string, price: string | number) {
  const amount = Number(price)
  if (amount === 0) return "ফ্রি"
  return `${currency === "BDT" ? "৳" : `${currency} `}${amount.toLocaleString("bn-BD")}`
}

export default async function Page() {
  let profile: ProfileDto | null = null
  try { profile = await authenticatedApiFetch<ProfileDto>("/auth/me", { cache: "no-store" }) } catch { /* anonymous visitor */ }
  let featuredCourses: CourseListResponse["courses"] = []
  try {
    const response = await publicApiFetch<CourseListResponse>("/courses?page=1&pageSize=3", { next: { revalidate: 300 } })
    featuredCourses = response.courses
  } catch { /* catalog can be temporarily unavailable */ }
  const dashboardPath = profile ? getDashboardPath(profile.role) : "/auth/signup"
  const ctaLabel = profile ? "ড্যাশবোর্ডে যান" : "অ্যাকাউন্ট খুলুন"

  return <PublicShell variant="home">
    <main className="folio-home">
      <section className="folio-home-hero"><div className="folio-home-wrap folio-home-hero-grid"><div className="folio-hero-copy">
        <span className="folio-home-tag"><span className="folio-live-dot" /> বাংলাদেশের শিক্ষার্থীদের জন্য</span>
        <h1>শিখুন গুছিয়ে, পেমেন্ট করুন নিজের মোবাইল ব্যাংকিং থেকে।</h1>
        <p className="folio-home-lead">সাজানো কোর্স, bKash ও Nagad এ সহজ পেমেন্ট, আর সুরক্ষিত ভিডিও ক্লাস। প্রতিটি এনরোলমেন্টের একটি যাচাইকৃত রেকর্ড থাকে।</p>
        <div className="folio-home-cta"><Link className="folio-home-btn folio-home-btn-primary" href={dashboardPath}>{ctaLabel}</Link><Link className="folio-home-btn" href="/courses">কোর্স দেখুন</Link></div>
        <p className="folio-home-note">পেমেন্ট করুন, TrxID জমা দিন, যাচাইয়ের পর ক্লাস চালু।</p>
      </div><div className="folio-order-card"><div className="folio-seal">যাচাই<br />সম্পন্ন</div><div className="folio-order-top"><span>ORD-482913</span><span className="folio-status">যাচাই সম্পন্ন</span></div><h2>ফ্রিল্যান্সিং ওয়েব ডেভেলপমেন্ট</h2><ul className="folio-lesson-list"><li className="is-done">ক্লাস ১ · রিকোয়েস্ট লাইফসাইকেল</li><li className="is-done">ক্লাস ২ · ক্যাশিং স্ট্র্যাটেজি</li><li>ক্লাস ৩ · কিউ ও ওয়ার্কার</li></ul><div className="folio-pay-box"><div><span>পেমেন্ট মাধ্যম</span><b>bKash</b></div><div><span>TrxID</span><code>9K4H2XQ7LM</code></div></div><div className="folio-order-stats"><div><small>অগ্রগতি</small><strong>৬৮%</strong><div className="folio-progress"><span /></div></div><div><small>পরিশোধিত</small><strong>৳৪,৫০০</strong></div></div></div></div></section>
      <section className="folio-payment-strip"><div className="folio-home-wrap"><p>যেভাবে পেমেন্ট করতে পারবেন</p><div className="folio-chips">{paymentMethods.map(([name, detail]) => <span className="folio-chip" key={name}>{name}{detail && <em>{detail}</em>}</span>)}</div></div></section>
      <section className="folio-stats"><div className="folio-home-wrap">{stats.map(([value, label]) => <div key={label}><b>{value}</b><span>{label}</span></div>)}</div></section>
      <section className="folio-home-section"><div className="folio-home-wrap"><div className="folio-section-heading"><div><small>ক্যাটাগরি</small><h2>আপনার লক্ষ্য অনুযায়ী কোর্স বেছে নিন।</h2></div></div><div className="folio-card-grid folio-card-grid-four">{categories.map(([title, body]) => <div className="folio-card" key={title}><h3>{title}</h3><p>{body}</p></div>)}</div></div></section>
      <section className="folio-home-section folio-band" id="courses"><div className="folio-home-wrap"><div className="folio-section-heading"><div><small>জনপ্রিয় কোর্স</small><h2>শুরু করুন এমন কিছু দিয়ে যা শেষ করার মতো।</h2></div><Link className="folio-home-btn" href="/courses">সব কোর্স দেখুন</Link></div><div className="folio-card-grid folio-card-grid-three">{featuredCourses.length > 0 ? featuredCourses.map((course, index) => <Link className="folio-course-card" href={`/courses/${course.slug}`} key={course.id}><div className={`folio-course-thumb folio-course-thumb-${index}`}>{course.thumbnailUrl ? <Image alt={course.title} className="object-cover" fill sizes="(min-width: 960px) 33vw, 100vw" src={course.thumbnailUrl} /> : <span>{course.title}</span>}</div><div className="folio-course-body"><span className="folio-course-category">{course.category ?? course.level.replace("_", " ")}</span><span className="folio-course-meta">{course.level.replace("_", " ")} · বাংলা</span><p>{course.shortDescription ?? "গোছানো ক্লাস ও হাতে-কলমে শেখার সুযোগ."}</p><div className="folio-course-footer"><strong>{formatPrice(course.currency, course.price)}</strong><ArrowUpRight aria-hidden className="size-5" /></div></div></Link>) : <p className="folio-empty-course">নতুন কোর্স প্রস্তুত হচ্ছে। এখন কী কী আছে দেখতে কোর্স তালিকায় যান।</p>}</div></div></section>
      <section className="folio-home-section" id="steps"><div className="folio-home-wrap"><div className="folio-section-heading"><div><small>এনরোলমেন্ট</small><h2>ব্রাউজ থেকে ক্লাস পর্যন্ত চার ধাপ।</h2></div></div><ol className="folio-steps">{steps.map(([code, title, body]) => <li key={code}><small>{code}</small><h3>{title}</h3><p>{body}</p></li>)}</ol></div></section>
      <section className="folio-home-section folio-band" id="faq"><div className="folio-home-wrap folio-faq"><div><small>জানার কথা</small><h2>এনরোল করার আগে পরিষ্কার হয়ে নিন।</h2><p>পেমেন্ট যাচাই, কোর্স অ্যাক্সেস ও ভিডিও নিরাপত্তা কীভাবে কাজ করে জেনে নিন।</p></div><div>{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}</summary><p>{answer}</p></details>)}</div></div></section>
      <section className="folio-home-final"><div className="folio-home-wrap"><h2>আজই আপনার ওয়ার্কস্পেস খুলুন এবং শেখা শুরু করুন।</h2><p>অ্যাকাউন্ট খোলা বিনামূল্যে। পেমেন্ট নিশ্চিত হলেই কোর্সে ঢুকতে পারবেন।</p><div className="folio-home-cta"><Link className="folio-home-btn folio-home-btn-primary" href={dashboardPath}>{ctaLabel}</Link><Link className="folio-home-btn" href="/courses">কোর্স দেখুন</Link></div></div></section>
      <div className="folio-home-trust"><div className="folio-home-wrap"><ShieldCheck /><span>প্রতিটি অর্ডার নম্বর ও TrxID সহ সংরক্ষিত থাকে। সমস্যা হলে সাপোর্টে জানালেই আমরা খুঁজে বের করতে পারি।</span></div></div>
    </main>
  </PublicShell>
}
