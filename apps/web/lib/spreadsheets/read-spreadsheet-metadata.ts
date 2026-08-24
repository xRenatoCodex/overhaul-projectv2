export const MAX_SPREADSHEET_BYTES = 20 * 1024 * 1024

export type SpreadsheetKind = "xlsx" | "csv"

export type SpreadsheetSheetMetadata = {
  name: string
  rowCount: number
  columnCount: number
  headers: string[]
}

export type SpreadsheetMetadata = {
  fileName: string
  fileSize: number
  kind: SpreadsheetKind
  sheets: SpreadsheetSheetMetadata[]
  warnings: string[]
}

export async function readSpreadsheetMetadata(
  file: File,
  allowedKinds: SpreadsheetKind[],
): Promise<SpreadsheetMetadata> {
  if (file.size > MAX_SPREADSHEET_BYTES) {
    throw new Error("El archivo supera el límite de 20 MB.")
  }

  const kind = getSpreadsheetKind(file.name)
  if (!kind || !allowedKinds.includes(kind)) {
    throw new Error(
      allowedKinds.includes("csv")
        ? "Selecciona un archivo .xlsx o .csv."
        : "Selecciona un archivo .xlsx.",
    )
  }

  return kind === "xlsx" ? readXlsxMetadata(file) : readCsvMetadata(file)
}

function getSpreadsheetKind(fileName: string): SpreadsheetKind | undefined {
  const extension = fileName.split(".").pop()?.toLowerCase()
  if (extension === "xlsx" || extension === "csv") {
    return extension
  }
  return undefined
}

async function readXlsxMetadata(file: File): Promise<SpreadsheetMetadata> {
  try {
    const { default: readXlsxFile } = await import("read-excel-file/browser")
    const workbook = await readXlsxFile(file)

    if (workbook.length === 0) {
      throw new Error("El libro no contiene hojas.")
    }

    return {
      fileName: file.name,
      fileSize: file.size,
      kind: "xlsx",
      sheets: workbook.map(({ sheet, data }) => summarizeRows(sheet, data)),
      warnings: [],
    }
  } catch (error) {
    if (error instanceof Error && error.message === "El libro no contiene hojas.") {
      throw error
    }
    throw new Error("No se pudo leer el archivo XLSX. Verifica que no esté dañado.")
  }
}

async function readCsvMetadata(file: File): Promise<SpreadsheetMetadata> {
  const Papa = await import("papaparse")

  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      worker: true,
      skipEmptyLines: "greedy",
      complete: ({ data, errors }) => {
        if (data.length === 0) {
          reject(new Error("El archivo CSV no contiene filas."))
          return
        }

        resolve({
          fileName: file.name,
          fileSize: file.size,
          kind: "csv",
          sheets: [summarizeRows("CSV", data)],
          warnings: errors.slice(0, 5).map((error) => error.message),
        })
      },
      error: () => {
        reject(new Error("No se pudo leer el archivo CSV."))
      },
    })
  })
}

function summarizeRows(name: string, rows: unknown[][]): SpreadsheetSheetMetadata {
  const populatedRows = rows.filter((row) => row.some(isPopulatedCell))
  const firstRow = populatedRows[0] ?? []

  return {
    name,
    rowCount: populatedRows.length,
    columnCount: populatedRows.reduce(
      (maximum, row) => Math.max(maximum, row.length),
      0,
    ),
    headers: firstRow.map(toCellText).filter(Boolean).slice(0, 20),
  }
}

function isPopulatedCell(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== ""
}

function toCellText(value: unknown) {
  if (value === null || value === undefined) {
    return ""
  }
  if (value instanceof Date) {
    return value.toLocaleDateString("es-PE")
  }
  if (typeof value === "object") {
    return "Valor compuesto"
  }
  return String(value).trim()
}
