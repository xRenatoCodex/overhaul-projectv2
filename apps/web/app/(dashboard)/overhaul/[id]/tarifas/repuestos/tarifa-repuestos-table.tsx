"use client"

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"

import type { TarifaParte } from "@workspace/backend/types/overhaul"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

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

type NumberField =
  | "quantity"
  | "replacementPercent"
  | "dealerNet"
  | "costoInterno"
  | "pu"

const textColumns: { field: TextField; label: string; width: string }[] = [
  { field: "partNumber", label: "N.° parte", width: "w-44" },
  { field: "partName", label: "Descripción", width: "w-64" },
  { field: "partNumberSap", label: "N.° SAP", width: "w-44" },
  { field: "segmentacion", label: "Segmentación", width: "w-44" },
  { field: "componentCode", label: "Componente", width: "w-40" },
  { field: "jobCode", label: "Job", width: "w-36" },
  { field: "parentPartName", label: "Parte padre", width: "w-56" },
  { field: "groupNumber", label: "Grupo", width: "w-36" },
]

const numberColumns: { field: NumberField; label: string; step: string }[] = [
  { field: "quantity", label: "Cantidad", step: "1" },
  { field: "replacementPercent", label: "% reemplazo", step: "0.01" },
  { field: "dealerNet", label: "Dealer net", step: "0.01" },
  { field: "costoInterno", label: "Costo interno", step: "0.01" },
  { field: "pu", label: "PU", step: "0.01" },
]

export function TarifaRepuestosTable({
  partes,
  onChange,
}: {
  partes: TarifaParte[]
  onChange: (partes: TarifaParte[]) => void
}) {
  function updateText(index: number, field: TextField, value: string) {
    onChange(
      partes.map((parte, parteIndex) =>
        parteIndex === index ? { ...parte, [field]: value } : parte,
      ),
    )
  }

  function updateNumber(index: number, field: NumberField, value: string) {
    const number = toNonNegativeNumber(value)
    onChange(
      partes.map((parte, parteIndex) => {
        if (parteIndex !== index) {
          return parte
        }

        const updated = { ...parte, [field]: number }
        return {
          ...updated,
          subtotal: roundMoney(updated.quantity * updated.pu),
        }
      }),
    )
  }

  function addParte() {
    onChange([...partes, createEmptyParte(partes.length)])
  }

  function removeParte(index: number) {
    const parte = partes[index]
    if (
      parte?.partNumber &&
      !window.confirm(`¿Eliminar el repuesto ${parte.partNumber}?`)
    ) {
      return
    }
    onChange(normalizePositions(partes.filter((_, parteIndex) => parteIndex !== index)))
  }

  function moveParte(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= partes.length) {
      return
    }

    const reordered = [...partes]
    const [parte] = reordered.splice(index, 1)
    if (!parte) {
      return
    }
    reordered.splice(targetIndex, 0, parte)
    onChange(normalizePositions(reordered))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border">
        <Table className="min-w-850 table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="sticky left-0 z-20 w-14 bg-muted">Ítem</TableHead>
              {textColumns.map((column) => (
                <TableHead key={column.field} className={column.width}>
                  {column.label}
                </TableHead>
              ))}
              {numberColumns.map((column) => (
                <TableHead key={column.field} className="w-40 text-right">
                  {column.label}
                </TableHead>
              ))}
              <TableHead className="w-40 text-right">Subtotal</TableHead>
              <TableHead className="w-44">Clasificación</TableHead>
              <TableHead className="w-64">Notas</TableHead>
              <TableHead className="w-64">Motivo</TableHead>
              <TableHead className="sticky right-0 z-20 w-30 bg-muted">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={19} className="h-24 text-center text-muted-foreground">
                  No hay repuestos registrados en esta tarifa.
                </TableCell>
              </TableRow>
            ) : (
              partes.map((parte, index) => (
                <TableRow key={parte.id ?? `parte-${index}`}>
                  <TableCell className="sticky left-0 z-10 bg-background text-center font-medium">
                    {index + 1}
                  </TableCell>
                  {textColumns.map((column) => (
                    <TableCell key={column.field}>
                      <Input
                        value={parte[column.field] ?? ""}
                        onChange={(event) =>
                          updateText(index, column.field, event.target.value)
                        }
                        aria-label={`${column.label}, ítem ${index + 1}`}
                      />
                    </TableCell>
                  ))}
                  {numberColumns.map((column) => (
                    <TableCell key={column.field}>
                      <Input
                        type="number"
                        min="0"
                        max={column.field === "replacementPercent" ? "100" : undefined}
                        step={column.step}
                        inputMode="decimal"
                        value={parte[column.field]}
                        onChange={(event) =>
                          updateNumber(index, column.field, event.target.value)
                        }
                        aria-label={`${column.label}, ítem ${index + 1}`}
                        className="text-right"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium tabular-nums">
                    {parte.subtotal.toLocaleString("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  {(["clasificacion", "notas", "motivo"] as const).map((field) => (
                    <TableCell key={field}>
                      <Input
                        value={parte[field] ?? ""}
                        onChange={(event) => updateText(index, field, event.target.value)}
                        aria-label={`${field}, ítem ${index + 1}`}
                      />
                    </TableCell>
                  ))}
                  <TableCell className="sticky right-0 z-10 bg-background">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveParte(index, -1)}
                        disabled={index === 0}
                        aria-label="Subir repuesto"
                        title="Subir repuesto"
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveParte(index, 1)}
                        disabled={index === partes.length - 1}
                        aria-label="Bajar repuesto"
                        title="Bajar repuesto"
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeParte(index)}
                        aria-label="Eliminar repuesto"
                        title="Eliminar repuesto"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Button type="button" variant="outline" onClick={addParte} className="self-start">
        <Plus data-icon="inline-start" />
        Añadir repuesto
      </Button>
    </div>
  )
}

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

function toNonNegativeNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}