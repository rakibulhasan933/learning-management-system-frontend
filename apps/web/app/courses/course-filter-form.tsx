"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Loader2, Search } from "lucide-react"
import type { CourseLevel } from "@workspace/types"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { FloatingInput } from "@workspace/ui/components/floating-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

interface CourseFilterFormProps {
  defaults: {
    category?: string
    level?: CourseLevel
    q?: string
  }
}

const levelOptions: Array<{ label: string; value: CourseLevel | "" }> = [
  { label: "Any level", value: "" },
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
  { label: "All levels", value: "all_levels" },
]

export function CourseFilterForm({ defaults }: CourseFilterFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const query = new URLSearchParams()

    for (const key of ["q", "level", "category"]) {
      const value = formData.get(key)

      if (typeof value === "string" && value.trim().length > 0) {
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
            <FloatingInput
              className="h-10 text-sm"
              defaultValue={defaults.category}
              label="Category"
              name="category"
            />
          </div>
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
