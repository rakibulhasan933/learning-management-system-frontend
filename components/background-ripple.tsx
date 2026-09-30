"use client"

import { useEffect, useRef, useState } from "react"

export function BackgroundRipple() {
  const ref = useRef<HTMLDivElement>(null)
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    function move(event: PointerEvent) {
      node?.style.setProperty("--ripple-x", `${event.clientX}px`)
      node?.style.setProperty("--ripple-y", `${event.clientY}px`)
    }

    function click() {
      setPulse((value) => value + 1)
    }

    window.addEventListener("pointermove", move, { passive: true })
    window.addEventListener("click", click)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("click", click)
    }
  }, [])

  return <div aria-hidden className="background-ripple" data-pulse={pulse} ref={ref} />
}

