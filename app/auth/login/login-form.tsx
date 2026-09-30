"use client"

import Link from "next/link"
import { useRef, useActionState, type FormEvent } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { Mail, Lock } from "lucide-react"

import {
  resendVerificationEmailAction,
  signInWithGoogleAction,
  signInWithPasswordFormAction,
  type AuthFormState,
} from "@/app/auth/actions"
import { initialAuthFormState } from "@/app/auth/form-state"
import { GoogleIcon } from "@/components/google-icon"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FloatingInput } from "@/components/ui/floating-input"
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
  serverState: AuthFormState
) {
  return values[key]?.message ?? serverState.fieldErrors[key] ?? undefined
}

export function LoginForm({ next }: LoginFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const validationBypassRef = useRef(false)
  const [serverState, formAction] = useActionState(
    signInWithPasswordFormAction,
    initialAuthFormState
  )
  const {
    formState: { errors },
    register,
    trigger,
    control,
  } = useForm<LoginValues>({
    defaultValues: { email: "", password: "" },
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
    if (!isValid) return

    validationBypassRef.current = true
    formRef.current?.requestSubmit()
  }

  const currentEmail = useWatch({ control, name: "email" })
  const activeEmail = serverState.unverifiedEmail ?? currentEmail

  return (
    <Card className="surface-raised rounded-2xl border-0 ring-0 hover:ring-0">
      <CardContent className="grid gap-6 px-7 py-1">
        {serverState.formError || serverState.unverifiedEmail ? (
          <div className="grid gap-3">
            <Alert variant="destructive">
              <AlertDescription>
                {serverState.formError ??
                  "Your account is not verified yet. Check your inbox or resend the verification email."}
              </AlertDescription>
            </Alert>
            {serverState.unverifiedEmail ? (
              <form action={resendVerificationEmailAction}>
                <input name="email" type="hidden" value={activeEmail} />
                <SubmitButton
                  className="w-full gap-2"
                  pendingLabel="পাঠানো হচ্ছে..."
                  variant="outline"
                >
                  যাচাই ইমেইল আবার পাঠান
                </SubmitButton>
              </form>
            ) : null}
          </div>
        ) : null}

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
            label="ইমেইল"
            autoComplete="email"
            autoFocus
            type="email"
          />

          <FloatingInput
            {...register("password")}
            error={getErrorMessage(errors, "password", serverState)}
            icon={<Lock />}
            label="পাসওয়ার্ড"
            autoComplete="current-password"
            type="password"
          />

          <div className="flex justify-end">
            <Link
              className="interactive-link text-sm text-muted-foreground"
              href="/auth/reset-password"
            >
              পাসওয়ার্ড ভুলে গেছেন?
            </Link>
          </div>

          <SubmitButton
            className="h-11 w-full gap-2"
            pendingLabel="লগইন হচ্ছে..."
          >
            লগইন করুন
          </SubmitButton>
        </form>

        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            or
          </span>
          <Separator className="flex-1" />
        </div>

        <form action={signInWithGoogleAction} className="grid">
          <input name="next" type="hidden" value={next ?? ""} />
          <SubmitButton className="h-11 gap-3" variant="outline">
            <GoogleIcon className="h-4 w-4" />
            Google দিয়ে চালিয়ে যান
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  )
}
