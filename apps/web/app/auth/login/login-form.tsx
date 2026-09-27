"use client"

import Link from "next/link"
import { useRef, useActionState, type FormEvent } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Mail, Lock } from "lucide-react"
import { useWatch } from "react-hook-form"

import {
  resendVerificationEmailAction,
  signInWithGoogleAction,
  signInWithPasswordFormAction,
  type AuthFormState,
} from "@/app/auth/actions"
import { initialAuthFormState } from "@/app/auth/form-state"
import { GoogleIcon } from "@/components/google-icon"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import { SubmitButton } from "@/components/submit-button"

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
})

type LoginValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  next?: string
}

function getErrorMessage(
  values: { email?: { message?: string }; password?: { message?: string } },
  key: keyof LoginValues,
  serverState: AuthFormState,
) {
  return values[key]?.message ?? serverState.fieldErrors[key] ?? undefined
}

export function LoginForm({ next }: LoginFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const validationBypassRef = useRef(false)
  const [serverState, formAction] = useActionState(
    signInWithPasswordFormAction,
    initialAuthFormState,
  )
  const {
    formState: { errors },
    register,
    trigger,
    control,
  } = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
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

  const currentEmail = useWatch({ control, name: "email" })
  const activeEmail = serverState.unverifiedEmail ?? currentEmail

  return (
    <Card className="border-border bg-card">
      <CardContent className="grid gap-6 p-6">
        <div className="space-y-4">
          {serverState.formError ? (
            <Alert variant="destructive">
              <AlertDescription>{serverState.formError}</AlertDescription>
            </Alert>
          ) : null}

          {serverState.unverifiedEmail ? (
            <div className="grid gap-3">
              <Alert variant="destructive">
                <AlertDescription>
                  {serverState.formError ??
                    "Your account is not verified yet. Check your inbox or resend the verification email."}
                </AlertDescription>
              </Alert>
              <form action={resendVerificationEmailAction}>
                <input name="email" type="hidden" value={activeEmail} />
                <SubmitButton
                  className="gap-2"
                  pendingLabel="Resending..."
                  variant="outline"
                >
                  Resend verification email
                </SubmitButton>
              </form>
            </div>
          ) : null}
        </div>

        <form
          ref={formRef}
          action={formAction}
          className="grid gap-5"
          onSubmit={submitWithValidation}
        >
          <input name="next" type="hidden" value={next ?? ""} />

          <FloatingInput
            {...register("email")}
            error={getErrorMessage(errors, "email", serverState)}
            icon={<Mail />}
            label="Email"
            autoComplete="email"
            autoFocus
            type="email"
          />

          <FloatingInput
            {...register("password")}
            error={getErrorMessage(errors, "password", serverState)}
            icon={<Lock />}
            label="Password"
            autoComplete="current-password"
            type="password"
          />

          <div className="flex items-center justify-between gap-4">
            <Link
              className="interactive-link text-xs text-muted-foreground"
              href="/auth/reset-password"
            >
              Forgot password?
            </Link>
          </div>

          <SubmitButton className="w-full gap-2" pendingLabel="Signing in...">
            Sign in
          </SubmitButton>
        </form>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-[10px] tracking-wide text-muted-foreground">
            or
          </span>
          <Separator className="flex-1" />
        </div>

        <form action={signInWithGoogleAction} className="grid">
          <input name="next" type="hidden" value={next ?? ""} />
          <SubmitButton className="gap-3" variant="outline">
            <GoogleIcon className="h-4 w-4" />
            Continue with Google
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  )
}
