"use client"

import { useRef, useActionState, type FormEvent } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, Mail, Lock, User } from "lucide-react"

import {
  signUpWithPasswordFormAction,
  type AuthFormState,
} from "@/app/auth/actions"
import { initialAuthFormState } from "@/app/auth/form-state"
import { Button } from "@workspace/ui/components/button"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Card, CardContent } from "@workspace/ui/components/card"
import { FloatingInput } from "@workspace/ui/components/floating-input"

const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(160, "Full name must be 160 characters or fewer."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(256, "Password is too long."),
})

type SignupValues = z.infer<typeof signupSchema>

function getErrorMessage(
  values: {
    email?: { message?: string }
    fullName?: { message?: string }
    password?: { message?: string }
  },
  key: keyof SignupValues,
  serverState: AuthFormState,
) {
  return values[key]?.message ?? serverState.fieldErrors[key] ?? undefined
}

export function SignupForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const validationBypassRef = useRef(false)
  const [serverState, formAction, isPending] = useActionState(
    signUpWithPasswordFormAction,
    initialAuthFormState,
  )
  const {
    formState: { errors },
    register,
    trigger,
  } = useForm<SignupValues>({
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
    },
    resolver: zodResolver(signupSchema),
    mode: "onSubmit",
  })

  async function submitWithValidation(event: FormEvent<HTMLFormElement>) {
    if (validationBypassRef.current) {
      validationBypassRef.current = false
      return
    }

    event.preventDefault()

    const isValid = await trigger()

    if (!isValid) {
      return
    }

    validationBypassRef.current = true
    formRef.current?.requestSubmit()
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="grid gap-6 p-6">
        {serverState.formError ? (
          <Alert variant="destructive">
            <AlertDescription>{serverState.formError}</AlertDescription>
          </Alert>
        ) : null}

        <form
          ref={formRef}
          action={formAction}
          className="grid gap-5"
          onSubmit={submitWithValidation}
        >
          <FloatingInput
            {...register("fullName")}
            error={getErrorMessage(errors, "fullName", serverState)}
            icon={<User />}
            label="Full name"
            autoComplete="name"
          />

          <FloatingInput
            {...register("email")}
            error={getErrorMessage(errors, "email", serverState)}
            icon={<Mail />}
            label="Email"
            autoComplete="email"
            type="email"
          />

          <FloatingInput
            {...register("password")}
            error={getErrorMessage(errors, "password", serverState)}
            icon={<Lock />}
            label="Password"
            autoComplete="new-password"
            type="password"
          />

          <Button className="w-full gap-2" disabled={isPending} type="submit">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPending ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
