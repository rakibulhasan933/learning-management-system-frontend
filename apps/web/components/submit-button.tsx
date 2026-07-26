"use client"

import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

interface SubmitButtonProps {
  children: React.ReactNode
  pendingLabel?: string
  className?: string
  variant?: "default" | "outline"
}

export function SubmitButton({
  children,
  pendingLabel,
  className,
  variant = "default",
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      className={cn("gap-2", className)}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  )
}