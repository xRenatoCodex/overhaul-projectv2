import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import type { OverhaulsSummaryMetrics } from "@workspace/backend/metrics/types"

export default function StatusTotalOverhaulsChart({
  data,
}: {
  data: OverhaulsSummaryMetrics
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Overhauls creados</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {data.totalOverhauls.toLocaleString("es-PE")}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">Total histórico</CardContent>
    </Card>
  )
}
