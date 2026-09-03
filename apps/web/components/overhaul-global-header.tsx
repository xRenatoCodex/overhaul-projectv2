import { CircleCheck, CircleDashed } from "lucide-react"

import type {
  OverhaulStage,
  OverhaulSummary,
} from "@workspace/backend/types/overhaul"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"

import { OverhaulHistoryDialog } from "@/components/overhaul-history-graph"

const stageLabels: Record<OverhaulStage, string> = {
  necesidad: "Necesidad",
  alcance: "Alcance",
  tarifas: "Tarifas",
  propuesta: "Propuesta",
  planificacion: "Planificación",
}

const estadoLabels: Record<OverhaulSummary["estado"], string> = {
  definicion: "En definición",
  aprobado: "Aprobado",
  cancelado: "Cancelado",
}

const estadoVariants: Record<
  OverhaulSummary["estado"],
  "secondary" | "default" | "destructive"
> = {
  definicion: "secondary",
  aprobado: "default",
  cancelado: "destructive",
}

export function OverhaulGlobalHeader({ summary }: { summary: OverhaulSummary }) {
  const { pendingStage } = summary

  return (
    <header className="sticky top-0 z-30 -mx-4 flex flex-col gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="truncate text-lg font-semibold tracking-tight">
          {summary.proyecto}
        </h1>
        <p className="truncate text-sm text-muted-foreground">{summary.cliente}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={estadoVariants[summary.estado]}>
          {estadoLabels[summary.estado]}
        </Badge>
        <Badge variant="outline" className="tabular-nums">
          Versión {summary.version}
        </Badge>
        <Badge variant={pendingStage ? "secondary" : "default"}>
          {pendingStage ? <CircleDashed /> : <CircleCheck />}
          {pendingStage
            ? `Pendiente: ${stageLabels[pendingStage]}`
            : "Todas las etapas completadas"}
        </Badge>
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <OverhaulHistoryDialog overhaulId={summary.overhaulId} />
      </div>
    </header>
  )
}
