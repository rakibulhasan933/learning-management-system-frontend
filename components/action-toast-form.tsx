"use client"

import type { FormHTMLAttributes, ReactNode } from "react"
import { useActionState, useEffect } from "react"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { toast } from "sonner"

type ActionToastFormProps = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  "action"
> & {
  action: (formData: FormData) => Promise<void>
  children: ReactNode
}

export function ActionToastForm({
  action,
  children,
  ...props
}: ActionToastFormProps) {
  const [error, formAction] = useActionState(
    async (_previousError: string | null, formData: FormData) => {
      try {
        await action(formData)
        return null
      } catch (actionError) {
        if (isRedirectError(actionError)) throw actionError
        return actionError instanceof Error
          ? actionError.message
          : "This action could not be completed. Please try again."
      }
    },
    null
  )

  useEffect(() => {
    if (error) toast.error("Action failed", { description: error })
  }, [error])

  return (
    <form action={formAction} {...props}>
      {children}
    </form>
  )
}
