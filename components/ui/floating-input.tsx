"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type FloatingInputProps = React.ComponentProps<typeof Input> & {
  error?: string
  icon?: React.ReactNode
  label: string
  hint?: string
}

function FloatingInput({
  className,
  error,
  hint,
  icon,
  id,
  label,
  type,
  autoComplete,
  ...props
}: FloatingInputProps) {
  const inputId = React.useId()
  const resolvedId = id ?? inputId
  const [visible, setVisible] = React.useState(false)
  const isPassword = type === "password"
  const resolvedType = isPassword ? (visible ? "text" : "password") : type

  return (
    <div className="group/field relative">
      {icon ? (
        <span className="pointer-events-none absolute top-3 left-4 z-10 -translate-y-1/2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </span>
      ) : null}

      <Input
        aria-invalid={error ? "true" : undefined}
        aria-describedby={
          error
            ? `${resolvedId}-error`
            : hint
              ? `${resolvedId}-hint`
              : undefined
        }
        id={resolvedId}
        placeholder=" "
        type={resolvedType}
        className={cn(
          "peer h-12 rounded-2xl border-border bg-input/20 px-2 text-base text-foreground placeholder:text-transparent focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 md:text-sm",
          icon && "pl-11",
          isPassword && "pr-11",
          error &&
            "border-destructive text-destructive focus-visible:border-destructive",
          className
        )}
        {...props}
        autoComplete={
          autoComplete ??
          (isPassword
            ? "current-password"
            : type === "email"
              ? "email"
              : undefined)
        }
      />

      <Label
        className={cn(
          // resting state: vertically centered against the h-12 input regardless of
          // icon/hint/error, since top-1/2 is relative to the wrapper's own height
          "pointer-events-none absolute top-3 left-4 z-20 origin-left -translate-y-1/2 rounded-md px-1 text-sm text-muted-foreground transition-all duration-200",
          icon && "left-11",
          "peer-focus:-top-2.5 peer-focus:-translate-y-1/2 peer-focus:scale-90 peer-focus:bg-background peer-focus:text-primary",
          "peer-[&:not(:placeholder-shown)]:-top-2.5 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:scale-90 peer-[&:not(:placeholder-shown)]:bg-background",
          error && "text-destructive peer-focus:text-destructive"
        )}
        htmlFor={resolvedId}
      >
        {label}
      </Label>

      {isPassword ? (
        <Button
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute top-3 right-6 z-20 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((current) => !current)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      ) : null}

      {hint ? (
        <p
          className="mt-1 text-xs text-muted-foreground"
          id={`${resolvedId}-hint`}
        >
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

export { FloatingInput }
