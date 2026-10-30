"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Loader2, Search } from "lucide-react"
import type { CourseLevel } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { FloatingInput } from "@/components/ui/floating-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CourseFilterFormProps {
  defaults: {
    category?: string
    level?: CourseLevel
    maxPrice?: string
    q?: string
  }
  categories: string[]
}

const levelOptions: Array<{ label: string; value: CourseLevel | "" }> = [
  { label: "যেকোনো স্তর", value: "" },
  { label: "শুরুর স্তর", value: "beginner" },
  { label: "মাঝারি স্তর", value: "intermediate" },
  { label: "অ্যাডভান্সড", value: "advanced" },
  { label: "সব স্তর", value: "all_levels" },
]

const field = "h-12 w-full border-[#343943] bg-[#1B1F29] text-sm text-[#F2EFE7]"

export function CourseFilterForm({
  defaults,
  categories,
}: CourseFilterFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const query = new URLSearchParams()

    for (const key of ["q", "level", "category", "maxPrice"]) {
      const value = formData.get(key)
      if (
        typeof value === "string" &&
        value.trim().length > 0 &&
        !(key === "category" && value === "all")
      ) {
        query.set(key, value.trim())
      }
    }

    const search = query.toString()
    startTransition(() => {
      router.push(search ? `/courses?${search}` : "/courses")
    })
  }

  return (
    <form
      aria-label="কোর্স ফিল্টার"
      className="grid gap-3 rounded-xl border border-[#343943] bg-[#12151C] sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      onSubmit={handleSubmit}
    >
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#A3A5AE]"
        />
        <FloatingInput
          className={`${field} pl-10`}
          defaultValue={defaults.q}
          label="কোর্স খুঁজুন"
          name="q"
        />
      </div>

      <Select defaultValue={defaults.level ?? ""} name="level">
        <SelectTrigger className={field}>
          <SelectValue placeholder="যেকোনো স্তর" />
        </SelectTrigger>
        <SelectContent>
          {levelOptions.map((option) => (
            <SelectItem key={option.label} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={defaults.category ?? "all"} name="category">
        <SelectTrigger className={field}>
          <SelectValue placeholder="যেকোনো ক্যাটাগরি" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">যেকোনো ক্যাটাগরি</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category.replaceAll("-", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <FloatingInput
        className={field}
        defaultValue={defaults.maxPrice}
        label="সর্বোচ্চ দাম (৳)"
        min="0"
        name="maxPrice"
        type="number"
      />

      <Button
        aria-busy={isPending || undefined}
        className="h-12 gap-2 bg-[#C9A15A] px-6 font-semibold text-[#12151C] hover:bg-[#A88A4A] sm:col-span-2 lg:col-span-1"
        disabled={isPending}
        type="submit"
      >
        {isPending ? (
          <Loader2 aria-hidden className="size-4 animate-spin" />
        ) : null}
        {isPending ? "খোঁজা হচ্ছে..." : "খুঁজুন"}
      </Button>
    </form>
  )
}
