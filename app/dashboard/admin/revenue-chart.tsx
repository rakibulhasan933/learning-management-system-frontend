"use client"

import type { AdminRevenuePointDto } from "@/lib/types"

interface RevenueChartProps {
  data: AdminRevenuePointDto[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map((item) => Number(item.revenue)), 1)
  return (
    <div className="flex h-80 w-full items-end gap-2 border-b border-border px-2 pt-6 sm:gap-4">
      {data.map((item) => {
        const value = Number(item.revenue)
        return (
          <div
            className="group flex min-w-0 flex-1 flex-col items-center gap-2"
            key={item.label}
          >
            <span className="pointer-events-none rounded-md bg-card px-2 py-1 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              BDT {value.toFixed(0)}
            </span>
            <div className="flex h-full w-full items-end">
              <div
                className="w-full rounded-t-md bg-primary/80 transition-[height,background-color] duration-300 group-hover:bg-primary"
                style={{
                  height: `${Math.max((value / maxRevenue) * 100, 3)}%`,
                }}
              />
            </div>
            <span className="max-w-full truncate text-[10px] text-muted-foreground">
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
