"use client"

import { useMemo } from "react"

import type { TarifaParte } from "@workspace/backend/types/overhaul"
import { DataTable } from "@workspace/ui/components/data-table"

import { buildRepuestosColumns } from "./repuestos-columns"

type ParsedPartes = Omit<TarifaParte, "id">[]

type Props = {
  partes: ParsedPartes
  onParteChange: (index: number, updated: Omit<TarifaParte, "id">) => void
}

export function TarifaRepuestosTab({ partes, onParteChange }: Props) {
  const columns = useMemo(
    () => buildRepuestosColumns(onParteChange as Parameters<typeof buildRepuestosColumns>[0]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {partes.length.toLocaleString("es-PE")} filas
        </span>{" "}
        detectadas. Los valores se muestran en USD (origen); la conversión se aplica al importar.
        Puedes editar cualquier celda antes de guardar.
      </p>
      <DataTable
        data={partes as (TarifaParte | Omit<TarifaParte, "id">)[]}
        columns={columns}
        pageSize={100}
        searchPlaceholder="Buscar por nombre, número de parte, SAP…"
      />
    </div>
  )
}