"use client"

import { ReactNode } from "react"
import { CheckCircle2, Circle, User, Clock } from "lucide-react"

import type { HistoryNodeData } from "@/lib/history-to-flow"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card"

const STAGE_LABELS: Record<string, string> = {
  necesidad: "Necesidad",
  alcance: "Alcance",
  tarifas: "Tarifas",
  propuesta: "Propuesta",
  planificacion: "Planificación",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function HistoryEntryPopover({
  data,
  children,
}: {
  data: HistoryNodeData
  children: ReactNode
}) {
  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="w-full h-full cursor-pointer">
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-72 text-sm p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-base">
                {STAGE_LABELS[data.stage] || data.stage}
              </div>
              <div className="text-xs text-muted-foreground">
                Versión {data.version}
              </div>
            </div>
            <div className="flex items-center">
              {data.isCompleted ? (
                <CheckCircle2 className="size-5 text-green-600" />
              ) : (
                <Circle className="size-5 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="border-t pt-2 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <User className="size-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">
                Autor:{" "}
                <span className="font-medium text-foreground">
                  {data.author || "Sistema"}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Clock className="size-3.5 text-muted-foreground flex-shrink-0" />
              <div className="space-y-1">
                <div className="text-muted-foreground">
                  Creado: <span className="font-mono text-xs">{formatDate(data.createdAt)}</span>
                </div>
                {data.updatedAt !== data.createdAt && (
                  <div className="text-muted-foreground">
                    Actualizado:{" "}
                    <span className="font-mono text-xs">{formatDate(data.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-2">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Estado
            </div>
            <div className="text-xs">
              {data.isCompleted ? (
                <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded">
                  Completado
                </span>
              ) : (
                <span className="inline-block bg-amber-100 text-amber-800 px-2 py-1 rounded">
                  Pendiente
                </span>
              )}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
