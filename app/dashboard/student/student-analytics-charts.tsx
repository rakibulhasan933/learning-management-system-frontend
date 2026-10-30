"use client"

import type {
  StudentQuizPerformanceDto,
  StudentWeeklyActivityDto,
} from "@/lib/types"

const bn = (n: number) => n.toLocaleString("bn-BD")

function Empty() {
  return (
    <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
      এখনো কোনো তথ্য নেই।
    </div>
  )
}

export function WeeklyActivityChart({
  data,
}: {
  data: StudentWeeklyActivityDto[]
}) {
  if (data.length === 0) return <Empty />

  const max = Math.max(...data.map((item) => item.minutes), 1)
  // Each point sits at the centre of its own column, so labels line up with it.
  const x = (index: number) => ((index + 0.5) / data.length) * 100
  const y = (minutes: number) => 100 - (minutes / max) * 82 - 8
  const points = data
    .map((item, index) => `${x(index)},${y(item.minutes)}`)
    .join(" ")

  return (
    <div className="w-full">
      <p className="mb-2 text-sm text-muted-foreground">
        সর্বোচ্চ {bn(max)} মিনিট
      </p>
      <svg
        aria-label="সাপ্তাহিক শেখার সময় (মিনিটে)"
        className="h-52 w-full overflow-visible text-foreground"
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 100 100"
      >
        {[8, 50, 92].map((line) => (
          <path
            d={`M0 ${line}H100`}
            key={line}
            stroke="currentColor"
            strokeOpacity={line === 92 ? 0.3 : 0.1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <polyline
          fill="none"
          points={points}
          stroke="var(--primary)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {/* Zero-length round-capped paths stay perfectly round when the SVG stretches. */}
        {data.map((item, index) => (
          <path
            d={`M${x(index)} ${y(item.minutes)}h0`}
            key={`${item.label}-${index}`}
            stroke="var(--primary)"
            strokeLinecap="round"
            strokeWidth="9"
            vectorEffect="non-scaling-stroke"
          >
            <title>{`${item.label}: ${bn(item.minutes)} মিনিট`}</title>
          </path>
        ))}
      </svg>
      <div
        className="mt-2 grid text-center text-xs text-muted-foreground"
        style={{
          gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
        }}
      >
        {data.map((item, index) => (
          <span className="truncate" key={`${item.label}-${index}`}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function QuizPerformanceChart({
  data,
}: {
  data: StudentQuizPerformanceDto[]
}) {
  if (data.length === 0) return <Empty />

  return (
    <ul
      aria-label="কুইজের ফলাফল (শতাংশে)"
      className="flex h-64 w-full items-end gap-2 border-b border-border px-1 sm:gap-4"
    >
      {data.map((item) => (
        <li
          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
          key={item.quizTitle}
          title={item.quizTitle}
        >
          <span className="text-xs font-medium tabular-nums">
            {bn(item.percentage)}%
          </span>
          <div className="flex min-h-0 w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-primary/70"
              style={{ height: `${Math.max(item.percentage, 3)}%` }}
            />
          </div>
          <span className="max-w-full truncate pb-1 text-xs text-muted-foreground">
            {item.quizTitle.slice(0, 12)}
          </span>
        </li>
      ))}
    </ul>
  )
}
