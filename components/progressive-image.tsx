"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

import { cn } from "@/lib/utils"

export function ProgressiveImage({ className, onError, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <Image
      {...props}
      className={cn(
        "transition-opacity duration-500 ease-out",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
      onLoad={(event) => {
        setLoaded(true)
        onLoad?.(event)
      }}
      onError={(event) => {
        setLoaded(true)
        onError?.(event)
      }}
    />
  )
}
