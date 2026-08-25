/**
 * Parser for the "Resumen" sheet of the tarifa XLSX.
 *
 * Layout (1-based row numbers, 0-based column indices):
 *   - Groups start at row 27 (index 26), column A (idx 0).
 *   - A group row has text in col A and "M.O. y Mat." in col M (idx 12).
 *   - Job rows have text in col B (idx 1), with values:
 *       materialAndMo → col M (idx 12)
 *       miscelaneos   → col N (idx 13)
 *       repuestos     → col O (idx 14)
 *   - Horas row: immediately after the last job of a group; col A and B are
 *     empty, col M contains the hours value (number or text like "602 HH").
 *   - Stop condition: any cell in any row contains the word "Subtotal".
 */

import type { TarifaGroupJob } from "@workspace/backend/types/overhaul"

// Column indices (0-based)
const COL_A = 0
const COL_B = 1
const COL_M = 12
const COL_N = 13
const COL_O = 14

const START_ROW_INDEX = 26 // row 27 (0-based)

export type ParseTarifaGroupsResult = {
  groups: Omit<TarifaGroupJob, "id">[]
  warnings: string[]
}

/**
 * Parses groups and jobs from the raw rows of the "Resumen" sheet.
 * `rows` is the full 0-based array returned by the spreadsheet reader,
 * where each row is an array of raw cell values.
 */
export function parseTarifaGroups(rows: unknown[][]): ParseTarifaGroupsResult {
  const warnings: string[] = []
  const groups: Omit<TarifaGroupJob, "id">[] = []

  let currentGroup: Omit<TarifaGroupJob, "id"> | null = null
  let lastJobRowIndex = -1

  for (let i = START_ROW_INDEX; i < rows.length; i++) {
    const row = rows[i] ?? []

    // Stop if any cell in this row contains "Subtotal"
    if (rowContains(row, "Subtotal")) {
      break
    }

    const cellA = cellText(row[COL_A])
    const cellB = cellText(row[COL_B])
    const cellM = row[COL_M]
    const cellN = row[COL_N]
    const cellO = row[COL_O]

    // Detect a group header: col A has text AND col M = "M.O. y Mat."
    if (cellA && cellText(cellM) === "M.O. y Mat.") {
      currentGroup = {
        name: cellA,
        horas: 0,
        position: groups.length,
        jobs: [],
      }
      groups.push(currentGroup)
      lastJobRowIndex = -1
      continue
    }

    if (!currentGroup) {
      continue
    }

    // Detect a job row: col B has text
    if (cellB) {
      const job = {
        name: cellB,
        materialAndMo: toNumber(cellM),
        miscelaneos: toNumber(cellN),
        repuestos: toNumber(cellO),
        position: currentGroup.jobs.length,
      }
      currentGroup.jobs.push(job)
      lastJobRowIndex = i
      continue
    }

    // Detect the horas row: col A and B empty, col M is a number or "NNN HH" text,
    // and this row comes right after the last job row.
    if (!cellA && !cellB && cellM != null && i === lastJobRowIndex + 1) {
      const horas = parseHoras(cellM)
      if (horas !== null) {
        currentGroup.horas = horas
      } else {
        warnings.push(
          `Fila ${i + 1}: no se pudo interpretar las horas del grupo "${currentGroup.name}": ${String(cellM)}`,
        )
      }
    }
  }

  if (groups.length === 0) {
    warnings.push(
      'No se encontraron grupos en la hoja "Resumen". Verifica que el archivo sea el correcto.',
    )
  }

  return { groups, warnings }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowContains(row: unknown[], keyword: string): boolean {
  const lower = keyword.toLowerCase()
  return row.some(
    (cell) => cell != null && String(cell).toLowerCase().includes(lower),
  )
}

function cellText(value: unknown): string {
  if (value == null) return ""
  return String(value).trim()
}

function toNumber(value: unknown): number {
  if (value == null) return 0
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value).replace(/[^\d.-]/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Parses horas from a cell value. Handles:
 *   - Plain numbers: 602, 601.67
 *   - Text with unit: "602 HH", "602HH", "602 hh"
 * Returns null if the value cannot be interpreted as a number.
 */
function parseHoras(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  const text = String(value).trim()
  // Strip trailing unit (HH, hh, Hh, h, etc.)
  const match = text.match(/^([\d.,]+)\s*[Hh]{1,2}$/)
  if (match?.[1]) {
    const parsed = Number(match[1].replace(",", "."))
    return Number.isFinite(parsed) ? parsed : null
  }
  // Last resort: try parsing the whole string as a number
  const parsed = Number(text.replace(/[^\d.-]/g, ""))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}
