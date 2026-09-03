"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { ExternalLink } from "lucide-react"

import type { MonitorItem, OverhaulState } from "@workspace/backend/types/overhaul"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { DataTable } from "@workspace/ui/components/data-table"

import { OverhaulHistoryDialog } from "@/components/overhaul-history-graph"
import { getNextStage, getStageLabel } from "@/lib/stage-utils"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const ESTADO_LABELS: Record<OverhaulState, string> = {
  definicion: "Definición",
  aprobado: "Aprobado",
  cancelado: "Cancelado",
}

const ESTADO_VARIANT: Record<
  OverhaulState,
  "default" | "secondary" | "outline" | "destructive"
> = {
  definicion: "secondary",
  aprobado: "default",
  cancelado: "destructive",
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  items: MonitorItem[]
  /** Route template using {id} as placeholder, e.g. "/overhaul/{id}/tarifas" */
  hrefTemplate: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MonitorTable({ items, hrefTemplate }: Props) {
  const router = useRouter()

  const columns = useMemo<ColumnDef<MonitorItem, unknown>[]>(
    () => [
      {
        accessorKey: "proyecto",
        header: "Proyecto",
        size: 200,
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "cliente",
        header: "Cliente",
        size: 160,
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "ubicacion",
        header: "Ubicación",
        size: 140,
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "tallerDestino",
        header: "Taller",
        size: 130,
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "estado",
        header: "Estado",
        size: 120,
        enableColumnFilter: true,
        enableSorting: true,
        cell: ({ getValue }) => {
          const v = getValue() as OverhaulState
          return (
            <Badge variant={ESTADO_VARIANT[v] ?? "secondary"}>
              {ESTADO_LABELS[v] ?? v}
            </Badge>
          )
        },
      },
      {
        accessorKey: "stages",
        header: "Etapa",
        size: 130,
        enableColumnFilter: true,
        enableSorting: false,
        cell: ({ getValue, row }) => {
          const stages = getValue() as Array<{ stage: string; isCompleted: boolean }>
          const nextStage = getNextStage(
            stages as Array<{ stage: any; isCompleted: boolean }>,
          )
          const label = getStageLabel(nextStage)
          const isFinished = nextStage === "finalizada"

          return (
            <Badge variant={isFinished ? "default" : "outline"}>
              {label}
            </Badge>
          )
        },
        filterFn: (row, _columnId, filterValue: string) => {
          if (!filterValue) return true
          const q = filterValue.toLowerCase()
          const stages = row.getValue("stages") as Array<{
            stage: string
            isCompleted: boolean
          }>
          const nextStage = getNextStage(
            stages as Array<{ stage: any; isCompleted: boolean }>,
          )
          const label = getStageLabel(nextStage).toLowerCase()
          return label.includes(q)
        },
      },
      {
        accessorKey: "version",
        header: "Ver.",
        size: 68,
        enableColumnFilter: false,
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-muted-foreground">v{getValue() as number}</span>
        ),
      },
      {
        accessorKey: "fechaEstimada",
        header: "F. Estimada",
        size: 120,
        enableColumnFilter: true,
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatDate(getValue() as string)}
          </span>
        ),
      },
      {
        accessorKey: "fechaTarifa",
        header: "F. Tarifa",
        size: 110,
        enableColumnFilter: true,
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatDate(getValue() as string)}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Actualizado",
        size: 120,
        enableColumnFilter: false,
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap tabular-nums text-muted-foreground">
            {formatDate(getValue() as string)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 96,
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
          const href = hrefTemplate.replace("{id}", row.original.overhaulId)

          return (
            <div className="flex items-center gap-1">
              <OverhaulHistoryDialog
                overhaulId={row.original.overhaulId}
                triggerVariant="ghost"
                compact
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => router.push(href)}
                title="Abrir"
              >
                <ExternalLink />
              </Button>
            </div>
          )
        },
      },
    ],
    [hrefTemplate, router],
  )

  return (
    <DataTable<MonitorItem>
      data={items}
      columns={columns}
      pageSize={50}
      searchPlaceholder="Buscar por proyecto, cliente, ubicación…"
    />
  )
}
