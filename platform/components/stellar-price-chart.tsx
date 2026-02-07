"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export type StellarPricePoint = {
  t: number
  price: number
}

const chartConfig = {
  price: {
    label: "Price",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

function formatUsd(value: number | undefined) {
  if (typeof value !== "number") return ""
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 4 : 8,
  })
}

export function StellarPriceChart({ data }: { data: StellarPricePoint[] }) {
  const normalized = React.useMemo(() => {
    return data
      .filter((p) => typeof p?.t === "number" && typeof p?.price === "number")
      .sort((a, b) => a.t - b.t)
      .map((p) => ({
        ...p,
        dateLabel: new Date(p.t).toLocaleDateString(undefined, {
          month: "short",
          day: "2-digit",
        }),
      }))
  }, [data])

  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <AreaChart data={normalized} margin={{ left: 8, right: 8, top: 12 }}>
        <defs>
          <linearGradient id="xlmPriceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
            <stop offset="70%" stopColor="#3b82f6" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="dateLabel"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => formatUsd(Number(v))}
        />
        <Tooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => label}
              formatter={(value) => (
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-mono font-medium tabular-nums">
                    {formatUsd(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#xlmPriceFill)"
          fillOpacity={1}
        />
      </AreaChart>
    </ChartContainer>
  )
}
