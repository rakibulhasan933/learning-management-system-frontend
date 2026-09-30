"use client"

import type {
  StudentQuizPerformanceDto,
  StudentWeeklyActivityDto,
} from "@/lib/types"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--foreground)",
}

export function WeeklyActivityChart({
  data,
}: {
  data: StudentWeeklyActivityDto[]
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart
          data={data}
          margin={{ bottom: 4, left: -20, right: 8, top: 12 }}
        >
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [`${value} মিনিট`, "দেখার সময়"]}
          />
          <Line
            dataKey="minutes"
            dot={{ fill: "var(--primary)", r: 3, strokeWidth: 0 }}
            name="দেখার সময়"
            stroke="var(--primary)"
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function QuizPerformanceChart({
  data,
}: {
  data: StudentQuizPerformanceDto[]
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          data={data}
          margin={{ bottom: 4, left: -20, right: 8, top: 12 }}
        >
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="quizTitle"
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            tickLine={false}
            tickFormatter={(value) => String(value).slice(0, 12)}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            domain={[0, 100]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(value) => `${value}%`}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [`${value}%`, "স্কোর"]}
          />
          <Bar
            dataKey="percentage"
            fill="var(--secondary)"
            name="স্কোর"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
