import { Badge } from "@workspace/ui/components/badge"
import type { OverhaulTarifasData } from "@workspace/backend/types/overhaul"

export function TarifaSummary({ tarifas }: { tarifas: OverhaulTarifasData }) {
  const jobCount = tarifas.groups.reduce(
    (total, group) => total + group.jobs.length,
    0,
  )

  const metrics = [
    { label: "Total", value: formatMoney(tarifas.total, tarifas.currency) },
    { label: "Grupos", value: tarifas.groups.length.toLocaleString("es-PE") },
    { label: "Jobs", value: jobCount.toLocaleString("es-PE") },
    { label: "Repuestos", value: tarifas.partes.length.toLocaleString("es-PE") },
  ]

  return (
    <div className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="flex flex-col gap-1 bg-background px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">
            {metric.label}
          </span>
          <span className="text-lg font-semibold">{metric.value}</span>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2 bg-background px-4 py-2 sm:col-span-2 lg:col-span-4">
        <Badge variant="outline">Versión {tarifas.version}</Badge>
        <Badge variant={tarifas.isCompleted ? "default" : "secondary"}>
          {tarifas.isCompleted ? "Completada" : "En definición"}
        </Badge>
        <Badge variant="outline">{tarifas.currency}</Badge>
      </div>
    </div>
  )
}

export function formatMoney(value: number, currency: "USD" | "PEN") {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}
