"use client"

import { useCallback, useEffect, useState } from "react"
import { GitBranch, History } from "lucide-react"

import type {
  OverhaulHistory,
  OverhaulHistoryEntry,
  OverhaulStage,
} from "@workspace/backend/types/overhaul"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

const lanes: {
  stage: OverhaulStage
  label: string
  fill: string
  border: string
  line: string
}[] = [
  {
    stage: "necesidad",
    label: "Necesidad",
    fill: "bg-sky-500",
    border: "border-sky-500",
    line: "bg-sky-500/25",
  },
  {
    stage: "alcance",
    label: "Alcance",
    fill: "bg-violet-500",
    border: "border-violet-500",
    line: "bg-violet-500/25",
  },
  {
    stage: "tarifas",
    label: "Tarifas",
    fill: "bg-amber-500",
    border: "border-amber-500",
    line: "bg-amber-500/25",
  },
  {
    stage: "propuesta",
    label: "Propuesta",
    fill: "bg-emerald-500",
    border: "border-emerald-500",
    line: "bg-emerald-500/25",
  },
  {
    stage: "planificacion",
    label: "Planificación",
    fill: "bg-rose-500",
    border: "border-rose-500",
    line: "bg-rose-500/25",
  },
]

const stageSummaries: Record<OverhaulStage, string> = {
  necesidad: "Necesidad actualizada",
  alcance: "Alcance actualizado",
  tarifas: "Tarifas actualizadas",
  propuesta: "Propuesta actualizada",
  planificacion: "Planificación actualizada",
}

export function OverhaulHistoryDialog({
  overhaulId,
  triggerLabel = "Historial",
  triggerVariant = "outline",
  compact = false,
}: {
  overhaulId: string
  triggerLabel?: string
  triggerVariant?: "outline" | "ghost" | "secondary"
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={compact ? "icon-sm" : "sm"}
          title="Ver historial de versiones"
          aria-label="Ver historial de versiones"
        >
          <History />
          {compact ? null : triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] gap-6 overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="size-4" />
            Historial de versiones
          </DialogTitle>
          <DialogDescription>
            Cada nodo representa una versión guardada de una etapa. Pasa el cursor
            sobre un nodo para ver el detalle.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <OverhaulHistoryGraph overhaulId={overhaulId} enabled={open} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function OverhaulHistoryGraph({
  overhaulId,
  enabled = true,
}: {
  overhaulId: string
  enabled?: boolean
}) {
  const [history, setHistory] = useState<OverhaulHistory | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const loadHistory = useCallback(
    async (signal: AbortSignal) => {
      setIsLoading(true)
      setError("")

      try {
        const response = await fetch(`/api/overhaul/${overhaulId}/historial`, {
          signal,
          cache: "no-store",
        })
        if (!response.ok) {
          throw new Error("No se pudo cargar el historial.")
        }
        setHistory((await response.json()) as OverhaulHistory)
      } catch (fetchError) {
        if (signal.aborted) return
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "No se pudo cargar el historial.",
        )
      } finally {
        if (!signal.aborted) {
          setIsLoading(false)
        }
      }
    },
    [overhaulId],
  )

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()
    void loadHistory(controller.signal)

    return () => controller.abort()
  }, [enabled, loadHistory])

  if (isLoading && !history) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </p>
    )
  }

  const entries = history?.entries ?? []

  if (entries.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Todavía no hay versiones registradas.
      </p>
    )
  }

  const timeline = [...entries].reverse()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {lanes.map((lane) => (
          <span
            key={lane.stage}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span className={cn("size-2 rounded-full border", lane.fill, lane.border)} />
            {lane.label}
          </span>
        ))}
      </div>

      <ol className="relative">
        {timeline.map((entry, index) => (
          <HistoryRow
            key={entry.id}
            entry={entry}
            isFirst={index === 0}
            isLast={index === timeline.length - 1}
          />
        ))}
      </ol>
    </div>
  )
}

function HistoryRow({
  entry,
  isFirst,
  isLast,
}: {
  entry: OverhaulHistoryEntry
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <li className="grid grid-cols-[repeat(5,1.5rem)_1fr] items-stretch gap-x-1">
      {lanes.map((lane) => {
        const isActiveLane = lane.stage === entry.stage

        return (
          <div key={lane.stage} className="relative flex justify-center py-2">
            <span
              aria-hidden
              className={cn(
                "absolute inset-y-0 w-px",
                lane.line,
                isFirst && "top-1/2",
                isLast && "bottom-1/2",
              )}
            />
            {isActiveLane ? (
              <HoverCard openDelay={80} closeDelay={80}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${stageSummaries[entry.stage]} · versión ${entry.version}`}
                    className={cn(
                      "relative z-10 size-3.5 shrink-0 self-center rounded-full border-2 transition-transform hover:scale-125 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                      lane.border,
                      entry.isCompleted ? lane.fill : "bg-background",
                    )}
                  />
                </HoverCardTrigger>
                <HoverCardContent align="start" className="w-80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      Versión {entry.version} · {lane.label}
                    </p>
                    <Badge variant={entry.isCompleted ? "default" : "outline"}>
                      {entry.isCompleted ? "Completada" : "En progreso"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stageSummaries[entry.stage]}
                  </p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                    <dt className="text-muted-foreground">Fecha</dt>
                    <dd className="tabular-nums">{formatDateTime(entry.createdAt)}</dd>
                    <dt className="text-muted-foreground">Autor</dt>
                    <dd>{entry.author ?? "Sistema"}</dd>
                  </dl>
                </HoverCardContent>
              </HoverCard>
            ) : null}
          </div>
        )
      })}

      <div className="flex min-w-0 flex-col justify-center border-b py-2 pl-3 last:border-b-0">
        <p className="truncate text-sm">
          <span className="font-medium">v{entry.version}</span>{" "}
          <span className="text-muted-foreground">
            {stageSummaries[entry.stage]}
          </span>
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {formatDateTime(entry.createdAt)} · {entry.author ?? "Sistema"}
        </p>
      </div>
    </li>
  )
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-PE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}
