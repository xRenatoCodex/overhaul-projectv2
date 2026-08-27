"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import type { OverhaulsCreatedByMonthPoint } from "@workspace/backend/metrics/types"

const chartConfig = {
  count: {
    label: "Overhauls creados",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export default function OverhaulsCreatedByMonthChart({
  data,
}: {
  data: OverhaulsCreatedByMonthPoint[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overhauls creados por mes</CardTitle>
        <CardDescription>Últimos 12 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

