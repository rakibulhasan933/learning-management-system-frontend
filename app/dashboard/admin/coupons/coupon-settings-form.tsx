"use client"

import { useRef, useState } from "react"

import { SubmitButton } from "@/components/submit-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateAdminSettingsAction } from "@/app/dashboard/admin/actions"

type Coupon = {
  code: string
  enabled: boolean
  expiresAt: string
  kind: "percent" | "amount"
  limit: string
  value: string
}

const pageSize = 5

function parseCoupons(value: string): Coupon[] {
  const coupons = value
    .split(",")
    .map((item) => item.trim().split(":"))
    .filter((parts) => parts.length >= 3 && parts[0])
    .map(([code, kind, amount, state, limit, expiresAt]) => ({
      code: code.toUpperCase(),
      enabled: state !== "disabled",
      expiresAt: expiresAt
        ? new Date(Number(expiresAt)).toISOString().slice(0, 16)
        : "",
      kind: kind === "amount" ? ("amount" as const) : ("percent" as const),
      limit: limit ?? "",
      value: amount,
    }))

  return coupons.length > 0
    ? coupons
    : [{ code: "", enabled: true, expiresAt: "", kind: "percent", limit: "", value: "" }]
}

export function CouponSettingsForm({ value }: { value: string }) {
  const [coupons, setCoupons] = useState(() => parseCoupons(value))
  const [activePage, setActivePage] = useState(1)
  const [disabledPage, setDisabledPage] = useState(1)
  const hiddenValue = useRef<HTMLInputElement>(null)

  function update(index: number, patch: Partial<Coupon>) {
    setCoupons((current) =>
      current.map((coupon, couponIndex) =>
        couponIndex === index ? { ...coupon, ...patch } : coupon
      )
    )
  }

  function remove(index: number) {
    setCoupons((current) => {
      const next = current.filter((_, couponIndex) => couponIndex !== index)
      return next.length > 0
        ? next
        : [{ code: "", enabled: true, expiresAt: "", kind: "percent", limit: "", value: "" }]
    })
  }

  const activeCoupons = coupons
    .map((coupon, index) => ({ coupon, index }))
    .filter(({ coupon }) => coupon.enabled)
  const disabledCoupons = coupons
    .map((coupon, index) => ({ coupon, index }))
    .filter(({ coupon }) => !coupon.enabled)

  function renderRows(items: Array<{ coupon: Coupon; index: number }>) {
    return items.map(({ coupon, index }) => (
      <div className="grid gap-2 rounded-xl border border-border bg-background p-3 sm:grid-cols-[1fr_140px_110px_130px_180px_auto_auto]" key={index}>
        <Input
          aria-label="Coupon code"
          onChange={(event) => update(index, { code: event.target.value })}
          placeholder="Coupon code"
          value={coupon.code}
        />
        <Select
          onValueChange={(kind: Coupon["kind"]) => update(index, { kind })}
          value={coupon.kind}
        >
          <SelectTrigger aria-label="Discount type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percent">Percentage</SelectItem>
            <SelectItem value="amount">Fixed amount</SelectItem>
          </SelectContent>
        </Select>
        <Input
          aria-label="Discount value"
          min="0"
          onChange={(event) => update(index, { value: event.target.value })}
          placeholder={coupon.kind === "percent" ? "10" : "500"}
          type="number"
          value={coupon.value}
        />
        <Select
          onValueChange={(status) => update(index, { enabled: status === "active" })}
          value={coupon.enabled ? "active" : "disabled"}
        >
          <SelectTrigger aria-label="Coupon status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
        <Input
          aria-label="Usage limit"
          disabled={!coupon.limit && coupon.limit !== "0"}
          min="1"
          onChange={(event) => update(index, { limit: event.target.value })}
          placeholder="Unlimited"
          type="number"
          value={coupon.limit}
        />
        <label className="flex items-center gap-2 whitespace-nowrap px-2 text-xs text-muted-foreground">
          <input
            checked={!coupon.limit}
            onChange={(event) =>
              update(index, { limit: event.target.checked ? "" : "1" })
            }
            type="checkbox"
          />
          Unlimited
        </label>
        <Input
          aria-label="Expiry time"
          onChange={(event) => update(index, { expiresAt: event.target.value })}
          type="datetime-local"
          value={coupon.expiresAt}
        />
        <Button
          onClick={() => update(index, { enabled: !coupon.enabled })}
          type="button"
          variant="outline"
        >
          {coupon.enabled ? "Disable" : "Enable"}
        </Button>
        <Button onClick={() => remove(index)} type="button" variant="ghost">
          Remove
        </Button>
      </div>
    ))
  }

  function renderPagination(
    total: number,
    page: number,
    setPage: (page: number) => void
  ) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    if (totalPages === 1) return null
    return (
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <Button disabled={page === 1} onClick={() => setPage(page - 1)} size="sm" type="button" variant="outline">Previous</Button>
          <Button disabled={page === totalPages} onClick={() => setPage(page + 1)} size="sm" type="button" variant="outline">Next</Button>
        </div>
      </div>
    )
  }

  return (
    <form
      action={updateAdminSettingsAction}
      className="grid gap-4"
      onSubmit={() => {
        if (hiddenValue.current) {
          hiddenValue.current.value = coupons
            .filter((coupon) => coupon.code.trim() && coupon.value.trim())
            .map((coupon) =>
                `${coupon.code.trim().toUpperCase()}:${coupon.kind}:${coupon.value.trim()}:${coupon.enabled ? "active" : "disabled"}:${coupon.limit.trim()}:${coupon.expiresAt ? Date.parse(coupon.expiresAt) : ""}`
            )
            .join(",")
        }
      }}
    >
      <input ref={hiddenValue} name="payment_coupons" type="hidden" />

      <div className="grid gap-5">
        <section className="grid gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg">Active coupons ({activeCoupons.length})</h3>
            <span className="text-xs text-secondary">Available to students</span>
          </div>
          {renderRows(activeCoupons.slice((activePage - 1) * pageSize, activePage * pageSize))}
          {activeCoupons.length === 0 ? <p className="text-sm text-muted-foreground">No active coupons.</p> : null}
          {renderPagination(activeCoupons.length, activePage, setActivePage)}
        </section>
        <section className="grid gap-3 border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg text-muted-foreground">Disabled coupons ({disabledCoupons.length})</h3>
            <span className="text-xs text-muted-foreground">Not available to students</span>
          </div>
          {renderRows(disabledCoupons.slice((disabledPage - 1) * pageSize, disabledPage * pageSize))}
          {disabledCoupons.length === 0 ? <p className="text-sm text-muted-foreground">No disabled coupons.</p> : null}
          {renderPagination(disabledCoupons.length, disabledPage, setDisabledPage)}
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() =>
            setCoupons((current) => [
              ...current,
              { code: "", enabled: true, expiresAt: "", kind: "percent", limit: "", value: "" },
            ])
          }
          type="button"
          variant="outline"
        >
          Add coupon
        </Button>
        <SubmitButton pendingLabel="Saving...">Save coupons</SubmitButton>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Choose percentage or fixed amount. Leave a row empty to skip it.
      </p>
    </form>
  )
}
