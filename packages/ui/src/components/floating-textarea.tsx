"use client"

import * as React from "react"

import { Textarea } from "@workspace/ui/components/textarea"
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"

type FloatingTextareaProps = React.ComponentProps<typeof Textarea> & {
  error?: string
  hint?: string
  label: string
}

function FloatingTextarea({
  className,
  error,
  hint,
  id,
  label,
  ...props
}: FloatingTextareaProps) {
  const inputId = React.useId()
  const resolvedId = id ?? inputId

  return (
    <div className="group/field relative">
      <Textarea
        aria-invalid={error ? "true" : undefined}
        aria-describedby={
          error ? `${resolvedId}-error` : hint ? `${resolvedId}-hint` : undefined
        }
        id={resolvedId}
        placeholder=" "
        className={cn(
          "peer min-h-28 rounded-2xl border-border bg-input/20 px-4 pb-3 pt-5 text-base text-foreground placeholder:text-transparent focus-visible:border-primary focus-visible:ring-0 md:text-sm",
          error && "border-destructive text-destructive focus-visible:border-destructive",
          className,
        )}
        {...props}
      />
      <Label
        className={cn(
          "pointer-events-none absolute left-4 top-5 z-20 origin-left bg-background px-1 text-sm text-muted-foreground transition-all duration-200",
          "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-90 peer-focus:text-primary",
          "peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:scale-90",
          error && "text-destructive peer-focus:text-destructive",
        )}
        htmlFor={resolvedId}
      >
        {label}
      </Label>

      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground" id={`${resolvedId}-hint`}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p className="mt-1 text-xs text-destructive" id={`${resolvedId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

export { FloatingTextarea }
