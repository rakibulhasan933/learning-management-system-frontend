"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Animation system for the public website (not mobile — Framer Motion and
 * GSAP are web libraries, React Native needs Reanimated instead).
 *
 * Division of labour, on purpose:
 * - Framer Motion: React mount / in-view reveals for hero and key blocks.
 * - GSAP + ScrollTrigger: scroll reveals for the long home page sections
 *   and cards, so the server-rendered page needs no JSX restructuring.
 * Both respect prefers-reduced-motion. Nothing animates on learn / player
 * screens, where motion would distract from study.
 */

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

export function GsapScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      // Sections and cards, in order, like a polished marketing page:
      // fade up on scroll, staggered within each grid.
      gsap.utils
        .toArray<HTMLElement>(".folio-home-section, .folio-stats, .folio-payment-strip")
        .forEach(section => {
          gsap.from(section, {
            opacity: 0,
            y: 28,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: { trigger: section, start: "top 88%", once: true },
          })
        })
      gsap.utils
        .toArray<HTMLElement>(".folio-card, .folio-course-card, .folio-steps li")
        .forEach((card, index) => {
          gsap.from(card, {
            opacity: 0,
            y: 24,
            duration: 0.55,
            delay: (index % 3) * 0.08,
            ease: "power2.out",
            scrollTrigger: { trigger: card, start: "top 90%", once: true },
          })
        })
    })
    return () => ctx.revert()
  }, [])
  return null
}

/**
 * GitHub Universe style text animations, Folio content only:
 * - ScrambleText: mono line starts garbled, resolves character by
 *   character in ~1.5s, then holds still (no loop). Same effect the
 *   Universe site uses for its mono sub-lines, on load / in view.
 * - TypeText: types letter by letter, then holds with a blinking
 *   block cursor, like the ".ship-and-tell/" line there.
 * Both show the final text immediately when reduced motion is on.
 */
const SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#0123456789abcdefghijklmnopqrstuvwxyz"

export function ScrambleText({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(text)
  useEffect(() => {
    if (reduce) { setShown(text); return }
    let frame = 0
    const total = text.length * 3
    const id = window.setInterval(() => {
      frame += 1
      const settled = Math.floor((frame / total) * text.length)
      let out = ""
      for (let i = 0; i < text.length; i += 1) {
        out += i < settled || text[i] === " " ? text[i] : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
      }
      setShown(out)
      if (frame >= total) { window.clearInterval(id); setShown(text) }
    }, 30)
    return () => window.clearInterval(id)
  }, [text, reduce])
  return <span className={className}>{shown}</span>
}

export function TypeText({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion()
  const [count, setCount] = useState(reduce ? text.length : 0)
  useEffect(() => {
    if (reduce) return
    if (count >= text.length) return
    const id = window.setTimeout(() => setCount(c => c + 1), 45)
    return () => window.clearTimeout(id)
  }, [count, text, reduce])
  return (
    <span className={className}>
      {text.slice(0, count)}
      <span className="folio-cursor" aria-hidden>▌</span>
    </span>
  )
}

/**
 * Universe26 hero headline, GSAP only:
 * The Universe wordmark did not type or fade — green bars masked it,
 * then swept away left-to-right in ~2s and the text stayed static.
 * This does the same for the Folio hero headline: a green mask
 * covers the h1, GSAP shrinks it toward the right edge, revealing
 * the headline left-to-right, once, no loop. Reduced motion shows
 * the headline immediately with no mask.
 */
export function GsapHeadline({ children }: { children: ReactNode }) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const maskRef = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (reduce) return
    if (!titleRef.current || !maskRef.current) return
    const tl = gsap.timeline({ defaults: { ease: "power4.inOut" } })
    tl.fromTo(titleRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0)
      .fromTo(maskRef.current, { scaleX: 1 }, { scaleX: 0, duration: 1.4, transformOrigin: "right center" }, 0.2)
    return () => { tl.kill() }
  }, [reduce])
  if (reduce) return <h1>{children}</h1>
  return (
    <h1 ref={titleRef} className="folio-hero-title">
      {children}
      <span ref={maskRef} className="folio-hero-mask" aria-hidden />
    </h1>
  )
}
