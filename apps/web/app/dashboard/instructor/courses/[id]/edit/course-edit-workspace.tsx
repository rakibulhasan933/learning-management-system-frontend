"use client"

import { useState, type ReactNode } from "react"
import { BookOpen, ChevronLeft, ChevronRight, Layers3, Settings2 } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

const steps = [
  { id: "details", label: "Course details", note: "Title, pricing, and media", icon: BookOpen },
  { id: "content", label: "Course content", note: "Milestones, modules, and materials", icon: Layers3 },
  { id: "settings", label: "Course settings", note: "Danger zone and course actions", icon: Settings2 },
] as const

export function CourseEditWorkspace({
  details,
  content,
  settings,
  initialStep = "details",
}: {
  details: ReactNode
  content: ReactNode
  settings: ReactNode
  initialStep?: (typeof steps)[number]["id"]
}) {
  const [activeStep, setActiveStep] = useState<(typeof steps)[number]["id"]>(initialStep)
  const panels = { details, content, settings }
  const activeIndex = steps.findIndex((step) => step.id === activeStep)
  const previousStep = steps[activeIndex - 1]
  const nextStep = steps[activeIndex + 1]

  return (
    <div className="grid gap-5">
      <nav aria-label="Course editing steps" className="grid gap-2 sm:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon
          const active = activeStep === step.id

          return (
            <button
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-left transition-colors sm:p-4",
                active
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              type="button"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[10px] text-primary">0{index + 1}</span>
                <span className="block truncate text-sm font-medium">{step.label}</span>
                <span className="hidden truncate text-xs text-muted-foreground sm:block">{step.note}</span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="rounded-3xl border border-border bg-card ring-1 ring-foreground/10">
        {steps.map((step) => (
          <div className={cn(activeStep !== step.id && "hidden")} key={step.id}>
            <div className="p-4 sm:p-5">{panels[step.id]}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4">
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          disabled={!previousStep}
          onClick={() => previousStep && setActiveStep(previousStep.id)}
          type="button"
        >
          <ChevronLeft className="size-4" />
          Previous
        </button>
        <p className="font-mono text-[10px] text-muted-foreground sm:text-xs">
          Step {activeIndex + 1} of {steps.length}
        </p>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-40"
          disabled={!nextStep}
          onClick={() => nextStep && setActiveStep(nextStep.id)}
          type="button"
        >
          Next
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
