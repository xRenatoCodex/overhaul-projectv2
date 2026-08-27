"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { TarifaParte } from "@workspace/backend/types/overhaul"
import { Input } from "@workspace/ui/components/input"

// ---------------------------------------------------------------------------
// Types
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

function roundMoney(v: number) {
  return Math.round((v + Number.EPSILON) * 100) / 100
}

// ---------------------------------------------------------------------------
// Factory: editable column defs for TarifaParte
// Receives an `onChange` callback so both the page table and the modal tab
// can share the same column definitions.
// ---------------------------------------------------------------------------

export function buildRepuestosColumns(
  onChange: (rowIndex: number, updated: TarifaParte | Omit<TarifaParte, "id">) => void,
): ColumnDef<TarifaParte | Omit<TarifaParte, "id">, unknown>[] {
  function updateText(rowIndex: number, row: TarifaParte | Omit<TarifaParte, "id">, field: TextField, value: string) {
    onChange(rowIndex, { ...row, [field]: value })
  }

  function updateNumber(
    rowIndex: number,
    row: TarifaParte | Omit<TarifaParte, "id">,
    field: NumberField,
    value: string,
  ) {
    const num = Math.max(0, Number(value) || 0)
    const updated = { ...row, [field]: num }
    // Recalculate subtotal when qty or pu changes
    if (field === "quantity" || field === "pu") {
      ;(updated as TarifaParte).subtotal = roundMoney(
        (field === "quantity" ? num : (row as TarifaParte).quantity) *
          (field === "pu" ? num : (row as TarifaParte).pu),
      )
    }
    onChange(rowIndex, updated)
  }

  function textCol(
    field: TextField,
    header: string,
    width: number,
    options: { enableColumnFilter?: boolean; enableSorting?: boolean } = {},
  ): ColumnDef<TarifaParte | Omit<TarifaParte, "id">, unknown> {
    return {
      id: field,
      accessorKey: field,
      header,
      size: width,
      enableColumnFilter: options.enableColumnFilter ?? true,
      enableSorting: options.enableSorting ?? true,
      cell: ({ row, getValue }) => (
        <Input
          value={(getValue() as string) ?? ""}
          onChange={(e) => updateText(row.index, row.original, field, e.target.value)}
          className="h-7 min-w-0 text-sm"
          aria-label={`${header}, ítem ${row.index + 1}`}
        />
      ),
    }
  }

  function numberCol(
    field: NumberField,
    header: string,
    width: number,
    step = "0.01",
    max?: string,
  ): ColumnDef<TarifaParte | Omit<TarifaParte, "id">, unknown> {
    return {
      id: field,
      accessorKey: field,
      header,
      size: width,
      enableColumnFilter: false,
      enableSorting: true,
      cell: ({ row, getValue }) => (
        <Input
          type="number"
          min="0"
          max={max}
          step={step}
          inputMode="decimal"
          value={getValue() as number}
          onChange={(e) => updateNumber(row.index, row.original, field, e.target.value)}
          className="h-7 w-full text-right text-sm"
          aria-label={`${header}, ítem ${row.index + 1}`}
        />
      ),
    }
  }

  const subtotalCol: ColumnDef<TarifaParte | Omit<TarifaParte, "id">, unknown> = {
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
    numberCol("quantity", "Qty", 80, "1"),
    numberCol("replacementPercent", "Repl. %", 85, "0.01", "100"),
    numberCol("dealerNet", "Dealer Net", 110),
    numberCol("costoInterno", "Costo Int.", 110),
    numberCol("pu", "PU", 110),
    subtotalCol,
    textCol("clasificacion", "Clasificación", 130),
    textCol("notas", "Notas", 160, { enableColumnFilter: false }),
    textCol("motivo", "Motivo", 130),
  ]
}
