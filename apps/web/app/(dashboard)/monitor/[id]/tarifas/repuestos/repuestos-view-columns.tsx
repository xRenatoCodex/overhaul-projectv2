"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { TarifaParte } from "@workspace/backend/types/overhaul"

// ---------------------------------------------------------------------------
// Read-only column defs for TarifaParte — mirrors repuestos-columns.tsx but
// renders plain text instead of editable inputs.
// ---------------------------------------------------------------------------

type TextField =
  | "segmentacion"
  | "componentCode"
  | "jobCode"
  | "parentPartName"
  | "groupNumber"
  | "partNumber"
  | "partNumberSap"
  | "partName"
  | "clasificacion"
  | "notas"
  | "motivo"

type NumberField = "quantity" | "replacementPercent" | "dealerNet" | "costoInterno" | "pu"

export function buildRepuestosReadColumns(): ColumnDef<TarifaParte, unknown>[] {
  function textCol(
    field: TextField,
    header: string,
    width: number,
    options: { enableColumnFilter?: boolean } = {},
  ): ColumnDef<TarifaParte, unknown> {
    return {
      id: field,
      accessorKey: field,
      header,
      size: width,
      enableColumnFilter: options.enableColumnFilter ?? true,
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="block truncate text-sm">{(getValue() as string) ?? ""}</span>
      ),
    }
  }

  function numberCol(
    field: NumberField,
    header: string,
    width: number,
  ): ColumnDef<TarifaParte, unknown> {
    return {
      id: field,
      accessorKey: field,
      header,
      size: width,
      enableColumnFilter: false,
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="block text-right text-sm tabular-nums">
          {(getValue() as number).toLocaleString("es-PE", {
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    }
  }

  const subtotalCol: ColumnDef<TarifaParte, unknown> = {
    id: "subtotal",
    accessorKey: "subtotal",
    header: "Subtotal",
    size: 110,
    enableColumnFilter: false,
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="block text-right text-sm font-medium tabular-nums">
        {(getValue() as number).toLocaleString("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    ),
  }

  return [
    {
      id: "position",
      accessorFn: (_row, i) => i + 1,
      header: "#",
      size: 50,
      enableColumnFilter: true,
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">{getValue() as number}</span>
      ),
    },
    textCol("partName", "Part Name", 240),
    textCol("partNumber", "N.° Parte", 120),
    textCol("partNumberSap", "N.° SAP", 110),
    textCol("segmentacion", "Segmentación", 120),
    textCol("componentCode", "Componente", 110),
    textCol("jobCode", "Job Code", 90),
    textCol("parentPartName", "Parte padre", 200),
    textCol("groupNumber", "Grupo #", 80, { enableColumnFilter: false }),
    numberCol("quantity", "Qty", 80),
    numberCol("replacementPercent", "Repl. %", 85),
    numberCol("dealerNet", "Dealer Net", 110),
    numberCol("costoInterno", "Costo Int.", 110),
    numberCol("pu", "PU", 110),
    subtotalCol,
    textCol("clasificacion", "Clasificación", 130),
    textCol("notas", "Notas", 160, { enableColumnFilter: false }),
    textCol("motivo", "Motivo", 130),
  ]
}
