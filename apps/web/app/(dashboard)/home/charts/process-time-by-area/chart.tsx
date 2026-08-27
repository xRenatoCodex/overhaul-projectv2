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
import type { ClosureTimeByAreaPoint } from "@workspace/backend/metrics/types"

const chartConfig = {
  averageDays: {
    label: "Días promedio",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export default function ProcessTimeByAreaChart({
  data,
}: {
  data: ClosureTimeByAreaPoint[]
}) {
  const hasData = data.some((point) => point.sampleSize > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tiempo de cierre por área</CardTitle>
        <CardDescription>Promedio de días para completar cada etapa</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
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
              <Bar
                dataKey="averageDays"
                fill="var(--color-averageDays)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay etapas completadas para calcular tiempos de cierre.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

