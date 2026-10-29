"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"

import { trackAffiliateAction } from "@/app/dashboard/instructor/affiliates/actions"

export const REF_STORAGE_KEY = "folio_ref_code"

/**
 * Referral capture for public course/bundle pages. When ?ref=CODE is
 * present it is stored in localStorage (so a later order can be
 * attributed) and a best-effort track call is fired. A failed track call
 * never blocks the page or the checkout, and nothing here claims an
 * email or SMS was sent.
 *
 * Render inside <Suspense> — useSearchParams requires it.
 */
export function RefCapture() {
  const searchParams = useSearchParams()
  const handledRef = useRef<string | null>(null)

  useEffect(() => {
    const code = searchParams.get("ref")?.trim()
    if (!code || handledRef.current === code) {
      return
    }
    handledRef.current = code
    try {
      window.localStorage.setItem(REF_STORAGE_KEY, code)
    } catch {
      // Private-mode storage failure must not break the page.
    }
    void trackAffiliateAction(code)
  }, [searchParams])

  return null
}
