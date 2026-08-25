/**
 * Parser for the "Partes Maquina" sheet of the tarifa XLSX.
 *
 * Column layout (0-based indices, row 1 = headers):
 *   A(0)  Segmentación
 *   B(1)  Component Code
 *   C(2)  Job Code
 *   D(3)  PARENT_PART_NAME
 *   E(4)  GROUP_NUMBER
 *   F(5)  PART_NUMBER  (original / legacy)
 *   G(6)  PN (partNumberSap equivalent — the SAP/internal part number)
 *   H(7)  PART_NAME
 *   I(8)  QUANTITY
 *   J(9)  Replacement %
 *   K(10) DN (Dealer Net)
 *   L(11) Costo interno
 *   M(12) PU (unit price)
 *   N(13) Subtotal
 *   O(14) reclasificacion (clasificacion)
 *   Z(25) Clasificación  (alternate clasificacion, used when O is blank)
 *   col26 Notas
 *   col27 Motivo 0%
 *
 * The first row (index 0) contains headers and is skipped.
 * Empty rows (no partName and no partNumber) are skipped.
 */

import type { TarifaParte } from "@workspace/backend/types/overhaul"

const COL_SEGMENTACION = 0
const COL_COMPONENT_CODE = 1
const COL_JOB_CODE = 2
const COL_PARENT_PART_NAME = 3
const COL_GROUP_NUMBER = 4
const COL_PART_NUMBER = 5
const COL_PART_NUMBER_SAP = 6
const COL_PART_NAME = 7
const COL_QUANTITY = 8
const COL_REPLACEMENT_PERCENT = 9
const COL_DEALER_NET = 10
const COL_COSTO_INTERNO = 11
const COL_PU = 12
const COL_SUBTOTAL = 13
const COL_RECLASIFICACION = 14
const COL_CLASIFICACION_ALT = 25
const COL_NOTAS = 26
const COL_MOTIVO = 27

const HEADER_ROW_INDEX = 0 // row 1 is headers (0-based index 0)

export type ParseTarifaRepuestosResult = {
  partes: Omit<TarifaParte, "id">[]
  warnings: string[]
}

/**
 * Parses spare parts from the raw rows of the "Partes Maquina" sheet.
 * `rows` is the full 0-based array returned by the spreadsheet reader,
 * where each row is an array of raw cell values.
 */
export function parseTarifaRepuestos(
  rows: unknown[][],
): ParseTarifaRepuestosResult {
  const warnings: string[] = []
  const partes: Omit<TarifaParte, "id">[] = []

  for (let i = HEADER_ROW_INDEX + 1; i < rows.length; i++) {
    const row = rows[i] ?? []

    const partName = cellText(row[COL_PART_NAME])
    const partNumber = cellText(row[COL_PART_NUMBER])

    // Skip entirely empty rows
    if (!partName && !partNumber) {
      continue
    }

    if (!partName) {
      warnings.push(`Fila ${i + 1}: fila sin PART_NAME omitida (PN: ${partNumber || "—"})`)
      continue
    }

    const clasificacion =
      cellText(row[COL_RECLASIFICACION]) || cellText(row[COL_CLASIFICACION_ALT])

    const parte: Omit<TarifaParte, "id"> = {
      segmentacion: cellText(row[COL_SEGMENTACION]),
      componentCode: cellText(row[COL_COMPONENT_CODE]),
      jobCode: cellText(row[COL_JOB_CODE]),
      parentPartName: cellText(row[COL_PARENT_PART_NAME]),
      groupNumber: cellText(row[COL_GROUP_NUMBER]),
      partNumber: partNumber,
      partNumberSap: cellText(row[COL_PART_NUMBER_SAP]),
      partName: partName,
      quantity: toNumber(row[COL_QUANTITY]),
      replacementPercent: toPercent(row[COL_REPLACEMENT_PERCENT]),
      dealerNet: toNumber(row[COL_DEALER_NET]),
      costoInterno: toNumber(row[COL_COSTO_INTERNO]),
      pu: toNumber(row[COL_PU]),
      subtotal: toNumber(row[COL_SUBTOTAL]),
      clasificacion,
      notas: optionalText(row[COL_NOTAS]),
      motivo: optionalText(row[COL_MOTIVO]),
      position: partes.length,
    }

    partes.push(parte)
  }

  if (partes.length === 0) {
    warnings.push(
      'No se encontraron repuestos en la hoja "Partes Maquina". Verifica que el archivo sea el correcto.',
    )
  }

  return { partes, warnings }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cellText(value: unknown): string {
  if (value == null) return ""
  return String(value).trim()
}

function optionalText(value: unknown): string | undefined {
  const text = cellText(value)
  return text || undefined
}

function toNumber(value: unknown): number {
  if (value == null) return 0
  if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, value) : 0
  const parsed = Number(String(value).replace(/[^\d.-]/g, ""))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

/**
 * Converts a replacement percentage cell.
 * The sheet stores it as a raw number (e.g. 100 = 100%, not 1.0 = 100%).
 * Clamps the result to [0, 100].
 */
function toPercent(value: unknown): number {
  const raw = toNumber(value)
  return Math.min(100, Math.max(0, raw))
}
