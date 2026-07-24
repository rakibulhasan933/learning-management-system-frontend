"use client"

import type { AdminRevenuePointDto } from "@workspace/types"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface RevenueChartProps {
  data: AdminRevenuePointDto[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} margin={{ bottom: 8, left: 0, right: 8, top: 16 }}>
          <CartesianGrid stroke="#2A2F3A" vertical={false} />
          <XAxis
            axisLine={{ stroke: "#2A2F3A" }}
            dataKey="label"
            tick={{ fill: "#8B8D98", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#8B8D98", fontSize: 12 }}
            tickFormatter={(value) => `${Number(value) / 1000}k`}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1B1F29",
              border: "1px solid #2A2F3A",
              borderRadius: 0,
              color: "#F2EFE7",
            }}
            cursor={{ fill: "#12151C" }}
            formatter={(value, name) => [
              name === "revenue" ? `BDT ${Number(value).toFixed(2)}` : value,
              name,
            ]}
          />
          <Bar dataKey="revenue" fill="#C9A15A" radius={0} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
