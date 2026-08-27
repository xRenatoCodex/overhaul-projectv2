import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import type { OverhaulsSummaryMetrics } from "@workspace/backend/metrics/types"

export default function StatusAvgPropuestaClosureChart({
  data,
}: {
  data: OverhaulsSummaryMetrics
}) {
  const hasData = data.averagePropuestaClosureDays !== null

  return (
    <Card>
      <CardHeader>
        <CardDescription>Cierre promedio de propuesta</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {hasData ? `${data.averagePropuestaClosureDays} días` : "Sin datos"}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {hasData
          ? `Basado en ${data.propuestaSampleSize} propuesta(s) cerrada(s)`
          : "Aún no hay propuestas cerradas"}
      </CardContent>
    </Card>
  )
}
