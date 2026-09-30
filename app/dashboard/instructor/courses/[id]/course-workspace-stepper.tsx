"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Settings2,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"

const steps = [
  {
    number: "01",
    icon: BookOpen,
    title: "কোর্সের তথ্য",
    description:
      "শিরোনাম, থাম্বনেইল, বিবরণ, মূল্য ও প্রকাশের অবস্থা আপডেট করুন।",
    path: "edit?step=details",
    action: "তথ্য খুলুন",
  },
  {
    number: "02",
    icon: Layers3,
    title: "কোর্সের কনটেন্ট তৈরি করুন",
    description:
      "Create milestones and modules. Each module can contain multiple videos, PDFs, quizzes, and assignments.",
    path: "edit?step=content",
    action: "বিল্ডার খুলুন",
  },
  {
    number: "03",
    icon: Users,
    title: "শিক্ষার্থীর অগ্রগতি",
    description:
      "Review enrollments, completion progress, and the latest learning activity.",
    path: "students",
    action: "শিক্ষার্থী দেখুন",
  },
  {
    number: "04",
    icon: Settings2,
    title: "কোর্স সেটিংস",
    description:
      "Manage course actions and the danger zone from one separate workspace.",
    path: "edit?step=settings",
    action: "সেটিংস খুলুন",
  },
] as const

export function CourseWorkspaceStepper({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)
  const step = steps[activeIndex]!
  const Icon = step.icon

  function openStep(index: number) {
    setActiveIndex(index)
    router.push(
      `/dashboard/instructor/courses/${courseId}/${steps[index]!.path}`
    )
  }

  return (
    <section className="grid gap-4" aria-labelledby="course-steps-title">
      <div>
        <p className="font-mono text-xs text-muted-foreground">পরবর্তী ধাপ</p>
        <h2
          className="mt-2 font-heading text-2xl tracking-tight"
          id="course-steps-title"
        >
          ধাপে ধাপে এই কোর্স পরিচালনা করুন
        </h2>
      </div>

      <div className="grid gap-5 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="grid gap-2 sm:grid-cols-4">
          {steps.map((item, index) => (
            <button
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${index === activeIndex ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
              key={item.number}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <span className="font-mono text-primary">{item.number}</span>
              <span className="truncate">{item.title}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-4 rounded-2xl border border-border bg-background p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-7">
          <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-card text-primary">
            <Icon className="size-5" />
          </span>
          <div>
            <p className="font-mono text-xs text-primary">
              Step {step.number} of {steps.length}
            </p>
            <h3 className="mt-1 font-heading text-2xl tracking-tight">
              {step.title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {step.description}
            </p>
          </div>
          <Button onClick={() => openStep(activeIndex)}>
            {step.action}
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            disabled={activeIndex === 0}
            onClick={() => openStep(activeIndex - 1)}
            variant="outline"
          >
            <ChevronLeft className="size-4" />
            আগের ধাপ
          </Button>
          <span className="font-mono text-xs text-muted-foreground">
            চালিয়ে যেতে একটি ধাপ বেছে নিন
          </span>
          <Button
            disabled={activeIndex === steps.length - 1}
            onClick={() => openStep(activeIndex + 1)}
          >
পরের ধাপ
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
