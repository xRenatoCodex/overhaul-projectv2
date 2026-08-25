/**
 * Reads the raw cell values from a named sheet in an XLSX file.
 * Returns a 2D array of raw values (numbers, strings, Dates, booleans, null).
 * This is a browser-side utility; it must be used from a client component.
 */
export async function readXlsxSheetRaw(
  file: File,
  sheetName: string,
): Promise<unknown[][]> {
  const { default: readXlsxFile } = await import("read-excel-file/browser")

  // read-excel-file returns all sheets when called with getSheets: true.
  // We call it normally — it returns an array of { sheet, data } objects.
  const workbook = (await readXlsxFile(file)) as Array<{
    sheet: string
    data: unknown[][]
  }>

  const entry = workbook.find((s) => s.sheet === sheetName)
  if (!entry) {
    const available = workbook.map((s) => `"${s.sheet}"`).join(", ")
    throw new Error(
      `No se encontró la hoja "${sheetName}" en el archivo. Hojas disponibles: ${available}.`,
    )
  }

  return entry.data
}
