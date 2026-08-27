"use client"

import { DataTable } from "@workspace/ui/components/data-table"
import type { TarifaParte } from "@workspace/backend/types/overhaul"

import { buildRepuestosReadColumns } from "./repuestos-view-columns"

export function TarifaRepuestosView({ partes }: { partes: TarifaParte[] }) {
  return (
    <DataTable
      columns={buildRepuestosReadColumns()}
      data={partes}
      searchPlaceholder="Buscar por nombre, número de parte, SAP…"
    />
  )
}
