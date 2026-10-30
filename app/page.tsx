import Link from "next/link"
import { ProgressiveImage } from "@/components/progressive-image"
import { ArrowUpRight, ShieldCheck } from "lucide-react"
import type { CourseListResponse, ProfileDto } from "@/lib/types"

import { PublicShell } from "@/components/public-shell"
import { authenticatedApiFetch, publicApiFetch } from "@/lib/api-client"
import { getDashboardPath } from "@/lib/auth/dashboard"
import { HeroQuiz } from "@/components/hero-quiz"

export const dynamic = "force-dynamic"

const tracks = [
  [
    "চাকরি ও BCS প্রস্তুতি",
    "সিলেবাস অনুযায়ী ক্লাস, মডেল টেস্ট ও প্রগ্রেস ট্র্যাকিং।",
  ],
  [
    "ব্যাংক ও সরকারি চাকরি",
    "ব্যাংক, প্রাইমারি ও অন্যান্য সরকারি চাকরির সিলেবাসভিত্তিক প্রস্তুতি।",
  ],
  [
    "ভর্তি ও একাডেমিক",
    "HSC, বিশ্ববিদ্যালয় ভর্তি ও বিষয়ভিত্তিক কোর্স, ধাপে ধাপে সাজানো।",
  ],
  ["ভাষা ও ক্যারিয়ার", "IELTS, স্পোকেন ইংলিশ, CV ও ইন্টারভিউ প্রস্তুতি।"],
]

const pains = [
  [
    "সিলেবাস এত বড়, কোথা থেকে শুরু করব?",
    "সিলেবাস অনুযায়ী সাজানো ক্লাস ও ধাপে ধাপে রুটিন।",
  ],
  [
    "মডেল টেস্ট না দিলে দুর্বলতা বোঝা যায় না",
    "কুইজ ও মডেল টেস্টে ভুল টপিক আলাদা করে দেখা যায়।",
  ],
  [
    "পড়া হলো, রিভিশন হয় না",
    "প্রোগ্রেস ও লেসন তালিকায় দেখুন কোথায় আটকে আছেন।",
  ],
  [
    "পেমেন্ট দিলাম, কোর্স খুলছে না",
    "TrxID জমা দিলে যাচাইয়ের পর কোর্স খোলে। অর্ডারে পুরো রেকর্ড থাকে।",
  ],
  [
    "ভিডিও কি নিরাপদ থাকবে?",
    "ওয়াটারমার্কসহ সুরক্ষিত ভিডিও, শুধু এনরোল করা ছাত্র দেখতে পারে।",
  ],
  [
    "মোবাইলে পড়তে পারব?",
    "ফোনে বা ল্যাপটপে শিখুন। BanglaBox অ্যাপে অফলাইন ডাউনলোডও আছে।",
  ],
]

const steps = [
  [
    "১",
    "ট্র্যাক বেছে নিন",
    "BCS, ব্যাংক বা একাডেমিক। দাম শুরু থেকেই টাকায় দেখা যাবে।",
  ],
  ["২", "কুপন দিন", "সক্রিয় কোড বসালে চূড়ান্ত অঙ্ক দেখতে পাবেন।"],
  [
    "৩",
    "bKash বা Nagad-এ পাঠান",
    "অর্ডারে দেখানো নম্বরে ঠিক ওই অঙ্ক পাঠিয়ে TrxID জমা দিন।",
  ],
  ["৪", "যাচাইয়ের পর ক্লাস শুরু", "পেমেন্ট যাচাই হলেই কোর্স খুলে যায়।"],
]

const faqs = [
  [
    "কখন কোর্সে ঢুকতে পারব?",
    "পেমেন্ট যাচাই হওয়ার পর। তার আগে অর্ডার পেন্ডিং থাকে এবং কোর্স লক থাকে।",
  ],
  [
    "bKash বা Nagad-এ পেমেন্ট করলে কীভাবে যাচাই হয়?",
    "অ্যাপের বাইরে পেমেন্ট করে sender নম্বর ও TrxID জমা দিন। PayConfirm স্বয়ংক্রিয়ভাবে যাচাই করলে অর্ডার Paid হয় আর অ্যাক্সেস খোলে।",
  ],
  [
    "ভুল অঙ্ক পাঠিয়ে ফেললে কী হবে?",
    "সাপোর্টে অর্ডার নম্বর ও TrxID পাঠান। আমরা ঘাটতি বা অতিরিক্ত অঙ্ক মিটিয়ে দেব।",
  ],
  [
    "কুপন কি চেকআউটেই দিতে হবে?",
    "হ্যাঁ। পেমেন্টের আগে কুপন দিন, তাহলে অর্ডারে ছাড়ের পরের অঙ্ক লেখা থাকবে।",
  ],
]

const thumbColors = ["bg-[#315B54]", "bg-[#3E596A]", "bg-[#6F5144]"]

const wrap = "mx-auto w-[min(1200px,calc(100%-2.5rem))]"
const section = "border-b border-[#343943] py-14 sm:py-20"
const h2 =
  "max-w-[20em] text-[1.75rem] leading-[1.4] font-semibold text-balance sm:text-[2.25rem] lg:text-[2.75rem]"
const btn =
  "inline-flex min-h-13 w-full items-center justify-center rounded-lg border border-[#343943] px-6 font-semibold text-[#F2EFE7] transition-colors hover:border-[#C9A15A] sm:w-auto"
const btnBrass =
  "inline-flex min-h-13 w-full items-center justify-center rounded-lg border border-[#C9A15A] bg-[#C9A15A] px-6 font-semibold text-[#12151C] transition-colors hover:border-[#A88A4A] hover:bg-[#A88A4A] sm:w-auto"
const row =
  "grid gap-1 border-t border-[#343943] py-5 md:grid-cols-[5fr_6fr] md:gap-12"

function formatPrice(currency: string, price: string | number) {
  const amount = Number(price)
  if (amount === 0) return "ফ্রি"
  return `${currency === "BDT" ? "৳" : `${currency} `}${amount.toLocaleString("bn-BD")}`
}

export default async function Page() {
  let profile: ProfileDto | null = null
  let featuredCourses: CourseListResponse["courses"] = []
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    try {
      profile = await authenticatedApiFetch<ProfileDto>("/auth/me", {
        cache: "no-store",
      })
    } catch {
      /* anonymous visitor */
    }
    try {
      const response = await publicApiFetch<CourseListResponse>(
        "/courses?page=1&pageSize=3",
        { next: { revalidate: 300 } }
      )
      featuredCourses = response.courses
    } catch {
      /* catalog can be temporarily unavailable */
    }
  }
  const dashboardPath = profile
    ? getDashboardPath(profile.role)
    : "/auth/signup"
  const ctaLabel = profile ? "ড্যাশবোর্ডে যান" : "অ্যাকাউন্ট খুলুন"

  return (
    <PublicShell variant="home">
      <main className="bg-[#12151C] leading-[1.85] text-[#F2EFE7] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[#C9A15A] [&_summary:focus-visible]:outline-2 [&_summary:focus-visible]:outline-[#C9A15A]">
        <section className="border-b border-[#343943]">
          <div
            className={`${wrap} grid items-center gap-12 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:py-24`}
          >
            <div>
              <h1 className="max-w-[13em] text-[2.4rem] leading-[1.3] font-semibold text-balance sm:text-[3.5rem] lg:text-[4.5rem]">
                BCS-এর প্রস্তুতি শুরু হোক একটা প্রশ্ন দিয়ে।
              </h1>
              <p className="mt-6 max-w-[34rem] text-lg text-[#A3A5AE]">
                সিলেবাস অনুযায়ী ক্লাস, মডেল টেস্ট ও প্রোগ্রেস ট্র্যাকিং। bKash
                বা Nagad-এ পেমেন্ট করুন, যাচাইয়ের পর ক্লাস চালু।
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className={btnBrass} href={dashboardPath}>
                  {ctaLabel}
                </Link>
                <Link className={btn} href="/courses">
                  কোর্স দেখুন
                </Link>
              </div>
              <p className="mt-5 text-sm text-[#A3A5AE]">
                পেমেন্ট: bKash, Nagad, Rocket ও ব্যাংক ট্রান্সফার
              </p>
            </div>
            <HeroQuiz />
          </div>
        </section>

        <section className={section}>
          <div className={wrap}>
            <h2 className={h2}>আপনার পরীক্ষা অনুযায়ী ট্র্যাক বেছে নিন।</h2>
            <ul className="mt-10 border-b border-[#343943]">
              {tracks.map(([title, body]) => (
                <li className={row} key={title}>
                  <h3 className="text-xl leading-[1.55] font-semibold">
                    {title}
                  </h3>
                  <p className="text-[#A3A5AE]">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${section} bg-[#1B1F29]`} id="courses">
          <div className={wrap}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className={h2}>জনপ্রিয় কোর্স</h2>
              <Link className={btn} href="/courses">
                সব কোর্স দেখুন
              </Link>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {featuredCourses.length > 0 ? (
                featuredCourses.map((course, index) => (
                  <Link
                    className="flex flex-col overflow-hidden rounded-xl border border-[#343943] bg-[#12151C] transition-colors hover:border-[#C9A15A]"
                    href={`/courses/${course.slug}`}
                    key={course.id}
                  >
                    <div
                      className={`relative flex min-h-44 items-end px-5 py-4 text-xl leading-[1.4] font-semibold text-white ${thumbColors[index % 3]}`}
                    >
                      {course.thumbnailUrl ? (
                        <ProgressiveImage
                          alt={course.title}
                          className="object-cover"
                          fill
                          priority={index === 0}
                          sizes="(min-width: 960px) 33vw, 100vw"
                          src={course.thumbnailUrl}
                        />
                      ) : (
                        <span>{course.title}</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <span className="text-sm text-[#C9A15A]">
                        {course.category ?? course.level.replace("_", " ")} ·
                        বাংলা
                      </span>
                      <p className="text-[0.95rem] text-[#A3A5AE]">
                        {course.shortDescription ??
                          "গোছানো ক্লাস ও হাতে-কলমে শেখার সুযোগ।"}
                      </p>
                      <div className="mt-auto flex items-center justify-between border-t border-[#343943] pt-3.5 text-xl">
                        <strong>
                          {formatPrice(course.currency, course.price)}
                        </strong>
                        <ArrowUpRight aria-hidden className="size-5" />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-[#343943] p-5 text-[#A3A5AE] lg:col-span-3">
                  নতুন কোর্স প্রস্তুত হচ্ছে। এখন কী কী আছে দেখতে কোর্স তালিকায়
                  যান।
                </p>
              )}
            </div>
          </div>
        </section>

        <section className={section}>
          <div className={wrap}>
            <h2 className={h2}>আটকে যাওয়ার জায়গা, আর তার সমাধান।</h2>
            <ul className="mt-10 border-b border-[#343943]">
              {pains.map(([pain, fix]) => (
                <li className={row} key={pain}>
                  <h3 className="text-xl leading-[1.55] font-medium text-[#A3A5AE]">
                    {pain}
                  </h3>
                  <p>{fix}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${section} bg-[#1B1F29]`} id="steps">
          <div className={wrap}>
            <h2 className={h2}>ব্রাউজ থেকে ক্লাস পর্যন্ত চার ধাপ।</h2>
            <ol className="mt-10 max-w-3xl">
              {steps.map(([n, title, body], i) => (
                <li
                  key={n}
                  className={`relative grid grid-cols-[3rem_1fr] gap-4 pb-8 ${
                    i < steps.length - 1
                      ? "after:absolute after:top-13 after:bottom-1 after:left-6 after:w-px after:bg-[#343943]"
                      : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className="grid size-12 place-items-center rounded-full border border-[#C9A15A] bg-[#1B1F29] text-xl font-semibold text-[#C9A15A]"
                  >
                    {n}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <p className="text-[#A3A5AE]">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={section} id="faq">
          <div
            className={`${wrap} grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-20`}
          >
            <div>
              <h2 className={h2}>এনরোল করার আগে জেনে নিন।</h2>
              <p className="mt-4 max-w-sm text-[#A3A5AE]">
                পেমেন্ট যাচাই, কোর্স অ্যাক্সেস ও ভিডিও নিরাপত্তা কীভাবে কাজ করে।
              </p>
            </div>
            <div className="border-b border-[#343943]">
              {faqs.map(([q, a], i) => (
                <details
                  className="group border-t border-[#343943] py-4"
                  key={q}
                  open={i === 0}
                >
                  <summary className="flex list-none justify-between gap-4 text-[1.0625rem] font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span
                      aria-hidden
                      className="text-2xl leading-[1.3] text-[#C9A15A]"
                    >
                      <span className="group-open:hidden">+</span>
                      <span className="hidden group-open:inline">–</span>
                    </span>
                  </summary>
                  <p className="mt-2.5 text-[#A3A5AE]">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className={wrap}>
            <h2 className={h2}>আজই প্রথম মডেল টেস্টটা দিন।</h2>
            <p className="mt-4 max-w-[30em] text-[#A3A5AE]">
              অ্যাকাউন্ট খোলা বিনামূল্যে। পেমেন্ট নিশ্চিত হলেই কোর্সে ঢুকতে
              পারবেন।
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className={btnBrass} href={dashboardPath}>
                {ctaLabel}
              </Link>
              <Link className={btn} href="/courses">
                কোর্স দেখুন
              </Link>
            </div>
          </div>
        </section>

        <div className="border-t border-[#343943]">
          <div className={`${wrap} flex gap-3 py-6 text-sm text-[#A3A5AE]`}>
            <ShieldCheck aria-hidden className="w-5 flex-none text-[#C9A15A]" />
            <span>
              প্রতিটি অর্ডার নম্বর ও TrxID সহ সংরক্ষিত থাকে। সমস্যা হলে সাপোর্টে
              জানালেই আমরা খুঁজে বের করতে পারি।
            </span>
          </div>
        </div>
      </main>
    </PublicShell>
  )
}
