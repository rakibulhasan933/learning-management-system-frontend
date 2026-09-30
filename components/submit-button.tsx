"use client"

import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SubmitButtonProps = React.ComponentProps<typeof Button> & {
  /** Replaces the label while the parent form is submitting. */
  pendingLabel?: string
}

export function SubmitButton({
  children,
  className,
  disabled,
  pendingLabel,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      {...props}
      aria-busy={pending || undefined}
      className={cn("gap-2", className)}
      disabled={pending || disabled}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  )
}
