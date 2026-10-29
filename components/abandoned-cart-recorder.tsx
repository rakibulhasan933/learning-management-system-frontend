"use client"

import { useEffect, useRef } from "react"

import { recordAbandonedCartAction } from "@/app/bundles/actions"

/**
 * Best-effort abandoned-cart record: when the visitor leaves a checkout
 * page without submitting payment proof, one fire-and-forget call records
 * the started checkout. It never blocks navigation or the proof flow, and
 * no marketing email or SMS is sent from it.
 */
export function AbandonedCartRecorder({
  courseId,
  bundleId,
}: {
  courseId?: string
  bundleId?: string
}) {
  const startedAtRef = useRef<string>(new Date().toISOString())
  const sentRef = useRef(false)

  useEffect(() => {
    const record = () => {
      if (sentRef.current) return
      sentRef.current = true
      const item =
        courseId !== undefined
          ? { courseId }
          : bundleId !== undefined
            ? { bundleId }
            : null
      if (!item) return
      void recordAbandonedCartAction({
        items: [item],
        startedAt: startedAtRef.current,
      })
    }

    window.addEventListener("pagehide", record)
    return () => {
      window.removeEventListener("pagehide", record)
    }
  }, [bundleId, courseId])

  return null
}
