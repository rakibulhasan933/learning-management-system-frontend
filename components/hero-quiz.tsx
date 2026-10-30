"use client"

import Link from "next/link"
import { useState } from "react"

const labels = ["ক", "খ", "গ", "ঘ"]
const options = ["বায়ু", "অগ্নি", "সলিল", "আকাশ"]
const correct = 1

export function HeroQuiz() {
  const [picked, setPicked] = useState<number | null>(null)
  const answered = picked !== null
  const isRight = picked === correct

  return (
    <div className="min-w-0 rounded-2xl bg-[#F2EFE7] p-5 text-[#12151C] shadow-[0_30px_70px_-40px_rgb(0_0_0/0.9)] sm:p-7">
      <p className="text-sm text-[#5b5e66]">মডেল টেস্ট · প্রশ্ন ১</p>
      <h2 className="mt-2 mb-5 text-[1.3rem] leading-[1.5] font-semibold text-balance sm:text-[1.65rem]">
        ‘অনল’ শব্দের সমার্থক শব্দ কোনটি?
      </h2>

      <div className="grid gap-2.5" role="group" aria-label="উত্তর বেছে নিন">
        {options.map((text, i) => {
          const isCorrect = answered && i === correct
          const isWrong = answered && i === picked && i !== correct
          const isDim = answered && !isCorrect && !isWrong
          return (
            <button
              key={text}
              type="button"
              aria-pressed={picked === i}
              disabled={answered}
              onClick={() => setPicked(i)}
              className={[
                "flex min-h-13 w-full items-center gap-3.5 rounded-lg border px-3.5 py-1.5 text-left text-[1.0625rem] transition-colors disabled:cursor-default",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A15A]",
                isCorrect
                  ? "border-[#3F7A6B] bg-[#3F7A6B]/15"
                  : isWrong
                    ? "border-[#B5483F] bg-[#B5483F]/10"
                    : "border-[#12151C]/20 bg-white/60 enabled:hover:border-[#12151C] enabled:hover:bg-white",
                isDim ? "opacity-50" : "",
              ].join(" ")}
            >
              <span
                aria-hidden
                className={[
                  "grid size-8 flex-none place-items-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isCorrect
                    ? "border-[#3F7A6B] bg-[#3F7A6B] text-white"
                    : isWrong
                      ? "border-[#B5483F] bg-[#B5483F] text-white"
                      : "border-[#12151C]",
                ].join(" ")}
              >
                {labels[i]}
              </span>
              {text}
            </button>
          )
        })}
      </div>

      <div className="mt-5 min-h-26 text-[0.97rem]" aria-live="polite">
        {answered ? (
          <>
            <p className="text-[1.05rem] font-bold">
              {isRight ? "সঠিক উত্তর।" : "উত্তর হবে অগ্নি।"}
            </p>
            <p>অনল, অগ্নি, পাবক, বহ্নি — সবই আগুনের প্রতিশব্দ।</p>
            <div className="mt-3.5 flex flex-wrap items-center gap-4">
              <Link
                href="/courses"
                className="inline-flex min-h-12 items-center rounded-lg bg-[#12151C] px-5 font-semibold text-[#F2EFE7] transition-colors hover:bg-black"
              >
                এমন মডেল টেস্টসহ কোর্স দেখুন
              </Link>
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="underline underline-offset-4"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          </>
        ) : (
          <p className="text-[#5b5e66]">
            একটি বৃত্ত বেছে নিন। ফল সঙ্গে সঙ্গে দেখুন।
          </p>
        )}
      </div>
    </div>
  )
}
