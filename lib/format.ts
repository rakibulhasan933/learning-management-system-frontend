/**
 * The single source of truth for money, time, and date rendering.
 *
 * These were previously re-implemented in ~10 files with three different
 * currency notations (`৳ `, `BDT `, `${currency} `) and inconsistent rounding.
 * The app standardises on `৳` with thousands separators.
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: "৳",
  USD: "$",
  EUR: "€",
  GBP: "£",
}

function symbolFor(currency: string) {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency.toUpperCase()
}

function toNumber(value: string | number) {
  const numeric = typeof value === "number" ? value : Number(value)

  return Number.isFinite(numeric) ? numeric : null
}

/**
 * Money with the currency symbol and two decimals: `৳ 4,500.00`.
 * Use for ledger figures — payments, payouts, revenue totals.
 */
export function formatCurrency(
  value: string | number,
  currency = "BDT"
): string {
  const numeric = toNumber(value)

  if (numeric === null) {
    return `${symbolFor(currency)} ${value}`
  }

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric)

  return `${symbolFor(currency)} ${formatted}`
}

/**
 * A catalog price: `Free` at zero, otherwise trimmed of trailing `.00`
 * (`৳ 4,500`). Use where the number is a label rather than an amount owed.
 */
export function formatPrice(price: string | number, currency = "BDT"): string {
  const numeric = toNumber(price)

  if (numeric === null) {
    return `${symbolFor(currency)} ${price}`
  }

  if (numeric === 0) {
    return "Free"
  }

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numeric)

  return `${symbolFor(currency)} ${formatted}`
}

/**
 * Coarse length for catalog and outline copy: `2h 15m`, `45m`.
 * Returns null at or below zero so callers can omit the row entirely.
 */
export function formatDuration(totalSeconds: number | null): string | null {
  if (!totalSeconds || totalSeconds <= 0) {
    return null
  }

  const seconds = Math.round(totalSeconds)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  return minutes > 0 ? `${minutes}m` : "< 1m"
}

/** Player timecode: `7:05`, `1:07:05`. */
export function formatClock(totalSeconds: number | null): string {
  if (!totalSeconds || totalSeconds <= 0) {
    return "0:00"
  }

  const seconds = Math.floor(totalSeconds)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  const paddedSeconds = remainder.toString().padStart(2, "0")

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${paddedSeconds}`
  }

  return `${minutes}:${paddedSeconds}`
}

/** `Aug 10, 2026` — use when the time of day carries no meaning. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
}

/** `Aug 10, 2026, 04:30 PM` — use for ledger events and submissions. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}
