"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus, Trash2 } from "lucide-react"

import type { TarifaParte } from "@workspace/backend/types/overhaul"
import { Button } from "@workspace/ui/components/button"
import { DataTable } from "@workspace/ui/components/data-table"
import { buildRepuestosColumns } from "../components/repuestos-columns";


type Props = {
  partes: TarifaParte[]
  onChange: (partes: TarifaParte[]) => void
}

export function TarifaRepuestosTable({ partes, onChange }: Props) {
  function handleRowChange(rowIndex: number, updated: TarifaParte | Omit<TarifaParte, "id">) {
    onChange(partes.map((p, i) => (i === rowIndex ? (updated as TarifaParte) : p)))
  }

  function removeParte(index: number) {
    const parte = partes[index]
    if (parte?.partNumber && !window.confirm(`¿Eliminar el repuesto ${parte.partNumber}?`)) {
      return
    }
    onChange(normalizePositions(partes.filter((_, i) => i !== index)))
  }

  function addParte() {
    onChange([...partes, createEmptyParte(partes.length)])
  }

  // Shared editable columns + action column
  const columns = useMemo<ColumnDef<TarifaParte, unknown>[]>(() => {
    const base = buildRepuestosColumns(
      handleRowChange as Parameters<typeof buildRepuestosColumns>[0],
    ) as ColumnDef<TarifaParte, unknown>[]

    const actionsCol: ColumnDef<TarifaParte, unknown> = {
      id: "actions",
      header: "",
      size: 50,
      enableColumnFilter: false,
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => removeParte(row.index)}
          aria-label="Eliminar repuesto"
          title="Eliminar repuesto"
        >
          <Trash2 />
        </Button>
      ),
    }

    return [...base, actionsCol]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partes])

  return (
    <div className="flex flex-col gap-3">
      <DataTable
        data={partes}
        columns={columns}
        pageSize={100}
        searchPlaceholder="Buscar por nombre, número de parte, SAP…"
      />

      <Button type="button" variant="outline" onClick={addParte} className="self-start">
        <Plus data-icon="inline-start" />
        Añadir repuesto
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptyParte(position: number): TarifaParte {
  return {
    segmentacion: "",
    componentCode: "",
    jobCode: "",
    parentPartName: "",
    groupNumber: "",
    partNumber: "",
    partNumberSap: "",
    partName: "",
    quantity: 0,
    replacementPercent: 0,
    dealerNet: 0,
    costoInterno: 0,
    pu: 0,
    subtotal: 0,
    clasificacion: "",
    notas: "",
    motivo: "",
    position,
  }
}

function normalizePositions(partes: TarifaParte[]) {
  return partes.map((parte, position) => ({ ...parte, position }))
}