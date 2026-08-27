"use client"

import { Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import type { OverhaulsByStatusPoint } from "@workspace/backend/metrics/types"

const stageColors: Record<OverhaulsByStatusPoint["stage"], string> = {
  necesidad: "var(--chart-1)",
  alcance: "var(--chart-2)",
  tarifas: "var(--chart-3)",
  propuesta: "var(--chart-4)",
  planificacion: "var(--chart-5)",
  completado: "var(--muted-foreground)",
}

const chartConfig = {
  count: { label: "Overhauls" },
  necesidad: { label: "Necesidad", color: stageColors.necesidad },
  alcance: { label: "Alcance", color: stageColors.alcance },
  tarifas: { label: "Tarifas", color: stageColors.tarifas },
  propuesta: { label: "Propuesta", color: stageColors.propuesta },
  planificacion: { label: "Planificación", color: stageColors.planificacion },
  completado: { label: "Completado", color: stageColors.completado },
} satisfies ChartConfig

export default function ProcessStatusChart({
  data,
}: {
  data: OverhaulsByStatusPoint[]
}) {
  const chartData = data.map((point) => ({
    ...point,
    fill: stageColors[point.stage],
  }))

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Overhauls por etapa activa</CardTitle>
        <CardDescription>Distribución según la etapa pendiente</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[280px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="stage" />} />
            <Pie data={chartData} dataKey="count" nameKey="stage" innerRadius={55} />
            <ChartLegend content={<ChartLegendContent nameKey="stage" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

