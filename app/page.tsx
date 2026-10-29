import Link from "next/link"
import { ProgressiveImage } from "@/components/progressive-image"
import { ArrowUpRight, ShieldCheck } from "lucide-react"
import type { CourseListResponse, ProfileDto } from "@/lib/types"

import { PublicShell } from "@/components/public-shell"
import { GsapScroll, Reveal, ScrambleText, TypeText } from "@/components/motion"
import { authenticatedApiFetch, publicApiFetch } from "@/lib/api-client"
import { getDashboardPath } from "@/lib/auth/dashboard"

export const dynamic = "force-dynamic"

const paymentMethods = [["bKash", "Send Money"], ["Nagad", "Send Money"], ["Rocket", "Send Money"], ["ব্যাংক ট্রান্সফার", ""]]
const stats = [["অটো", "PayConfirm দিয়ে যাচাই করা পেমেন্ট"], ["TrxID সহ রেকর্ড", "প্রতি এনরোলমেন্টে ১টি"], ["সুরক্ষিত", "ডাউনলোড-নিরাপদ ভিডিও ক্লাস"]]
const categories = [["চাকরি ও BCS প্রস্তুতি", "সিলেবাস অনুযায়ী ক্লাস, মডেল টেস্ট ও প্রগ্রেস ট্র্যাকিং."], ["ভর্তি ও একাডেমিক", "HSC, বিশ্ববিদ্যালয় ভর্তি ও বিষয়ভিত্তিক কোর্স, ধাপে ধাপে সাজানো."], ["ব্যাংক ও সরকারি চাকরি", "ব্যাংক, প্রাইমারি ও অন্যান্য সরকারি চাকরির পরীক্ষার সিলেবাসভিত্তিক প্রস্তুতি."], ["ভাষা ও ক্যারিয়ার", "IELTS, স্পোকেন ইংলিশ, CV ও ইন্টারভিউ প্রস্তুতি."]]
const steps = [["০১", "পরীক্ষার ট্র্যাক বেছে নিন", "BCS, ব্যাংক বা একাডেমিক — ট্র্যাক বেছে নিন, দাম শুরু থেকেই টাকায় দেখা যাবে."], ["০২", "কুপন দিন", "সক্রিয় কোড বসালে চূড়ান্ত টাকার অঙ্ক দেখতে পাবেন."], ["০৩", "bKash / Nagad এ পাঠান", "অর্ডারে দেখানো নম্বরে ঠিক ওই অঙ্ক পাঠিয়ে TrxID জমা দিন."], ["০৪", "যাচাইয়ের পর ক্লাস চালু", "পেমেন্ট যাচাই হলেই কোর্স খুলে যায়, ফোনে বা ল্যাপটপে."]]

const painSolutions = [["সিলেবাস এত বড়, কোথা থেকে শুরু করব?", "সিলেবাস অনুযায়ী সাজানো ক্লাস ও ধাপে ধাপে রুটিন — বিষয়ভিত্তিকভাবে এগিয়ে যান।"], ["মডেল টেস্ট না দিলে দুর্বলতা বোঝা যায় না", "কুইজ ও মডেল টেস্ট দিয়ে নিয়মিত মূল্যায়ন, ভুল টপিক আলাদা করে দেখা যায়।"], ["পড়া হলো, রিভিশন হয় না", "প্রোগ্রেস ও লেসন তালিকা দিয়ে কোথায় আটকে আছেন, তা পরিষ্কার দেখা যায়।"], ["পেমেন্ট দিলাম, কোর্স খুলছে না", "TrxID জমা দিলে যাচাইয়ের পর কোর্স খোলে, আর অর্ডারে পুরো রেকর্ড থাকে।"], ["ভিডিও কি নিরাপদ থাকবে?", "সুরক্ষিত ভিডিও, ওয়াটারমার্কসহ, শুধু এনরোল করা ছাত্রই দেখতে পারে।"], ["মোবাইলে পড়তে পারব?", "ফোনে বা ল্যাপটপে শিখুন, BanglaBox অ্যাপে অফলাইন ডাউনলোডসহ।"]]
const faqs = [["কখন কোর্সে ঢুকতে পারব?", "পেমেন্ট যাচাই হওয়ার পর। যাচাই না হওয়া পর্যন্ত অর্ডার পেন্ডিং থাকে এবং কোর্স লক থাকে."], ["bKash বা Nagad এ পেমেন্ট করলে কীভাবে যাচাই হয়?", "অ্যাপের বাইরে পেমেন্ট করে sender নম্বর ও TrxID জমা দেবেন। PayConfirm স্বয়ংক্রিয়ভাবে যাচাই করলে অর্ডার Paid হয় আর অ্যাক্সেস খোলে."], ["ভুল অঙ্ক পাঠিয়ে ফেললে কী হবে?", "সাপোর্টে অর্ডার নম্বর ও TrxID পাঠান। আমরা ঘাটতি বা অতিরিক্ত অঙ্ক মিটিয়ে দেব."], ["কুপন কি চেকআউটেই দিতে হবে?", "হ্যাঁ। পেমেন্টের আগে কুপন দিন, তাহলে অর্ডারে ছাড়ের পরের অঙ্ক লেখা থাকবে."]]

function formatPrice(currency: string, price: string | number) {
  const amount = Number(price)
  if (amount === 0) return "ফ্রি"
  return `${currency === "BDT" ? "৳" : `${currency} `}${amount.toLocaleString("bn-BD")}`
}

export default async function Page() {
  let profile: ProfileDto | null = null
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    try {
      profile = await authenticatedApiFetch<ProfileDto>("/auth/me", { cache: "no-store" })
    } catch { /* anonymous visitor */ }
  }
  let featuredCourses: CourseListResponse["courses"] = []
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    try {
      const response = await publicApiFetch<CourseListResponse>("/courses?page=1&pageSize=3", { next: { revalidate: 300 } })
      featuredCourses = response.courses
    } catch { /* catalog can be temporarily unavailable */ }
  }
  const dashboardPath = profile ? getDashboardPath(profile.role) : "/auth/signup"
  const ctaLabel = profile ? "ড্যাশবোর্ডে যান" : "অ্যাকাউন্ট খুলুন"

  return <PublicShell variant="home">
    <main className="folio-home"><GsapScroll />
      <section className="folio-home-hero"><div className="folio-home-wrap folio-home-hero-grid"><div className="folio-hero-copy">
        <span className="folio-home-tag"><span className="folio-live-dot" /> BCS · ব্যাংক · সরকারি চাকরি · একাডেমিক</span>
        <h1>BCS ও চাকরির পরীক্ষার প্রস্তুতি, এক জায়গায় গুছিয়ে।</h1>
        <p className="folio-home-lead">সিলেবাস অনুযায়ী ক্লাস, মডেল টেস্ট ও প্রোগ্রেস ট্র্যাকিং — BCS, ব্যাংক ও সরকারি চাকরির পরীক্ষা এবং একাডেমিক কোর্সের জন্য। bKash ও Nagad এ সহজ পেমেন্ট, যাচাইয়ের পর ক্লাস চালু।</p>
        <div className="folio-home-cta"><Link className="folio-home-btn folio-home-btn-primary" href={dashboardPath}>{ctaLabel}</Link><Link className="folio-home-btn" href="/courses">কোর্স দেখুন</Link></div>
        <p className="folio-home-note">পেমেন্ট করুন, TrxID জমা দিন, যাচাইয়ের পর ক্লাস চালু।</p><ScrambleText className="folio-mono-line" text="folio.learn() // bcs + bank + academic" /><TypeText className="folio-mono-line" text="bcs.tracks() / model-test / progress" /></div><Reveal delay={0.12} className="folio-order-card"><div className="folio-seal">যাচাই<br />সম্পন্ন</div><div className="folio-order-top"><span>ORD-482913</span><span className="folio-status">যাচাই সম্পন্ন</span></div><h2>BCS প্রিলিমিনারি — বাংলা ও গণিত</h2><ul className="folio-lesson-list"><li className="is-done">ক্লাস ১ · বাংলা ব্যাকরণ</li><li className="is-done">ক্লাস ২ · গণিতের শর্টকাট</li><li>ক্লাস ৩ · মডেল টেস্ট ১</li></ul><div className="folio-pay-box"><div><span>পেমেন্ট মাধ্যম</span><b>bKash</b></div><div><span>TrxID</span><code>9K4H2XQ7LM</code></div></div><div className="folio-order-stats"><div><small>অগ্রগতি</small><strong>৬৮%</strong><div className="folio-progress"><span /></div></div><div><small>পরিশোধিত</small><strong>৳৪,৫০০</strong></div></div></Reveal></div></section>
      <div className="folio-ticker" aria-hidden><div className="folio-ticker-track"><span><b>BCS প্রস্তুতি</b> · মডেল টেস্ট · সিলেবাসভিত্তিক ক্লাস · bKash / Nagad পেমেন্ট · অফলাইন ডাউনলোড · </span><span><b>BCS প্রস্তুতি</b> · মডেল টেস্ট · সিলেবাসভিত্তিক ক্লাস · bKash / Nagad পেমেন্ট · অফলাইন ডাউনলোড · </span></div></div>
      <section className="folio-payment-strip"><div className="folio-home-wrap"><p>যেভাবে পেমেন্ট করতে পারবেন</p><div className="folio-chips">{paymentMethods.map(([name, detail]) => <span className="folio-chip" key={name}>{name}{detail && <em>{detail}</em>}</span>)}</div></div></section>
      <section className="folio-stats"><div className="folio-home-wrap">{stats.map(([value, label]) => <div key={label}><b>{value}</b><span>{label}</span></div>)}</div></section>
      <section className="folio-home-section"><div className="folio-home-wrap"><div className="folio-section-heading"><div><small>আটকে যাওয়ার জায়গা</small><h2>সমস্যাটা কোথায়, সমাধানটাই বা কী।</h2></div></div><div className="folio-pain-grid">{painSolutions.map(([pain, solution]) => <div className="folio-pain-card" key={pain}><p className="folio-pain-label">প্যারা</p><h3>{pain}</h3><p className="folio-pain-solution-label">সমাধান</p><p>{solution}</p></div>)}</div></div></section>
      <section className="folio-home-section"><div className="folio-home-wrap"><div className="folio-section-heading"><div><small>পরীক্ষা ও একাডেমিক ট্র্যাক</small><h2>আপনার পরীক্ষা অনুযায়ী ট্র্যাক বেছে নিন।</h2></div></div><div className="folio-card-grid folio-card-grid-four">{categories.map(([title, body]) => <div className="folio-card" key={title}><h3>{title}</h3><p>{body}</p></div>)}</div></div></section>
      <section className="folio-home-section folio-band" id="courses"><div className="folio-home-wrap"><div className="folio-section-heading"><div><small>জনপ্রিয় কোর্স</small><h2>পরীক্ষার প্রস্তুতি শুরু করুন এমন কিছু দিয়ে যা শেষ করার মতো।</h2></div><Link className="folio-home-btn" href="/courses">সব কোর্স দেখুন</Link></div><div className="folio-card-grid folio-card-grid-three">{featuredCourses.length > 0 ? featuredCourses.map((course, index) => <Link className="folio-course-card" href={`/courses/${course.slug}`} key={course.id}><div className={`folio-course-thumb folio-course-thumb-${index}`}>{course.thumbnailUrl ? <ProgressiveImage alt={course.title} className="object-cover" fill priority={index === 0} sizes="(min-width: 960px) 33vw, 100vw" src={course.thumbnailUrl} /> : <span>{course.title}</span>}</div><div className="folio-course-body"><span className="folio-course-category">{course.category ?? course.level.replace("_", " ")}</span><span className="folio-course-meta">{course.level.replace("_", " ")} · বাংলা</span><p>{course.shortDescription ?? "গোছানো ক্লাস ও হাতে-কলমে শেখার সুযোগ."}</p><div className="folio-course-footer"><strong>{formatPrice(course.currency, course.price)}</strong><ArrowUpRight aria-hidden className="size-5" /></div></div></Link>) : <p className="folio-empty-course">নতুন কোর্স প্রস্তুত হচ্ছে। এখন কী কী আছে দেখতে কোর্স তালিকায় যান।</p>}</div></div></section>
      <section className="folio-home-section" id="steps"><div className="folio-home-wrap"><div className="folio-section-heading"><div><small>এনরোলমেন্ট</small><h2>ব্রাউজ থেকে ক্লাস পর্যন্ত চার ধাপ।</h2></div></div><ol className="folio-steps">{steps.map(([code, title, body]) => <li key={code}><small>{code}</small><h3>{title}</h3><p>{body}</p></li>)}</ol></div></section>
      <section className="folio-home-section folio-band" id="faq"><div className="folio-home-wrap folio-faq"><div><small>জানার কথা</small><h2>এনরোল করার আগে পরিষ্কার হয়ে নিন।</h2><p>পেমেন্ট যাচাই, কোর্স অ্যাক্সেস ও ভিডিও নিরাপত্তা কীভাবে কাজ করে জেনে নিন।</p></div><div>{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}</summary><p>{answer}</p></details>)}</div></div></section>
      <section className="folio-home-final"><div className="folio-home-wrap"><h2>আজই BCS প্রস্তুতি শুরু করুন, ধাপে ধাপে এগিয়ে যান।</h2><p>অ্যাকাউন্ট খোলা বিনামূল্যে। পেমেন্ট নিশ্চিত হলেই কোর্সে ঢুকতে পারবেন।</p><div className="folio-home-cta"><Link className="folio-home-btn folio-home-btn-primary" href={dashboardPath}>{ctaLabel}</Link><Link className="folio-home-btn" href="/courses">কোর্স দেখুন</Link></div></div></section>
      <div className="folio-home-trust"><div className="folio-home-wrap"><ShieldCheck /><span>প্রতিটি অর্ডার নম্বর ও TrxID সহ সংরক্ষিত থাকে। সমস্যা হলে সাপোর্টে জানালেই আমরা খুঁজে বের করতে পারি।</span></div></div>
    </main>
  </PublicShell>
}
