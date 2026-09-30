"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Loader2, Search, SlidersHorizontal } from "lucide-react"
import type { CourseLevel } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  { label: "Any level", value: "" },
  { label: "শুরুর স্তর", value: "beginner" },
  { label: "মাঝারি স্তর", value: "intermediate" },
  { label: "অ্যাডভান্সড", value: "advanced" },
  { label: "সব স্তর", value: "all_levels" },
]

export function CourseFilterForm({ defaults, categories }: CourseFilterFormProps) {
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
    <Card size="sm">
      <CardContent>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="size-3.5 text-primary" />
            Find your next course
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <FloatingInput
              className="h-10 pl-9 text-sm"
              defaultValue={defaults.q}
              label="Search courses"
              name="q"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select defaultValue={defaults.level ?? ""} name="level">
              <SelectTrigger className="h-10 w-full text-sm">
                <SelectValue placeholder="Any level" />
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
              <SelectTrigger className="h-10 w-full text-sm">
                <SelectValue placeholder="Any category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.replaceAll("-", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FloatingInput
            className="h-10 text-sm"
            defaultValue={defaults.maxPrice}
            label="Maximum price"
            min="0"
            name="maxPrice"
            type="number"
          />
          <Button
            aria-busy={isPending || undefined}
            className="gap-2"
            disabled={isPending}
            type="submit"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isPending ? "Applying filters..." : "Apply filters"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
