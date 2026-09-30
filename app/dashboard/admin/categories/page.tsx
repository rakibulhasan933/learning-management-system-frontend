import type { AdminCategoryListResponse } from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"
import {
  createCategoryAction,
  deleteCategoryAction,
} from "@/app/dashboard/admin/actions"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { Textarea } from "@/components/ui/textarea"
import { SubmitButton } from "@/components/submit-button"

export const dynamic = "force-dynamic"
export default async function AdminCategoriesPage() {
  const { categories } = await authenticatedApiFetch<AdminCategoryListResponse>(
    "/admin/categories",
    { cache: "no-store" }
  )
  return (
    <>
      <PageHeader
        eyebrow="Admin dashboard · Taxonomy"
        title="Category management"
        lede="Create clean course categories and keep catalog filtering consistent."
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardContent>
            <form action={createCategoryAction} className="grid gap-4">
              <h2 className="font-heading text-2xl">New category</h2>
              <FloatingInput label="Name" name="name" required />
              <FloatingInput
                label="Slug"
                name="slug"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              />
              <Textarea
                name="description"
                placeholder="Description (optional)"
              />
              <SubmitButton pendingLabel="Creating...">
                Create category
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="grid gap-3">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No categories yet.
                </p>
              ) : (
                categories.map((category) => (
                  <div
                    className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0"
                    key={category.id}
                  >
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        /{category.slug}
                      </p>
                    </div>
                    <form action={deleteCategoryAction}>
                      <input
                        name="categoryId"
                        type="hidden"
                        value={category.id}
                      />
                      <SubmitButton pendingLabel="..." variant="outline">
                        Delete
                      </SubmitButton>
                    </form>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
