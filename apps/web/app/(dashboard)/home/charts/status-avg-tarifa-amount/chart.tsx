import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import type { OverhaulsSummaryMetrics } from "@workspace/backend/metrics/types"

function formatMoney(value: number, currency: "USD" | "PEN") {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export default function StatusAvgTarifaAmountChart({
  data,
}: {
  data: OverhaulsSummaryMetrics
}) {
  const { averageTarifaAmountByCurrency } = data

  return (
    <Card>
      <CardHeader>
        <CardDescription>Monto promedio de tarifas</CardDescription>
        {averageTarifaAmountByCurrency.length === 0 ? (
          <CardTitle className="text-3xl font-semibold">Sin datos</CardTitle>
        ) : (
          <div className="flex flex-col gap-1">
            {averageTarifaAmountByCurrency.map((item) => (
              <CardTitle key={item.currency} className="text-2xl font-semibold tabular-nums">
                {formatMoney(item.average, item.currency)}
              </CardTitle>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {averageTarifaAmountByCurrency.length > 0
          ? averageTarifaAmountByCurrency
              .map((item) => `${item.currency}: ${item.count} tarifa(s)`)
              .join(" · ")
          : "Aún no hay tarifas registradas"}
      </CardContent>
    </Card>
  )
}
