"use client"

import { useRef, useState } from "react"
import { IconCloud } from "@tabler/icons-react"
import {
  AlertCircle,
  FileSpreadsheet,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import {
  readSpreadsheetMetadata,
  type SpreadsheetKind,
  type SpreadsheetMetadata,
} from "@/lib/spreadsheets/read-spreadsheet-metadata"

export function SpreadsheetUpload({
  allowedKinds,
  label,
  className,
  onLoadData,
}: {
  allowedKinds: SpreadsheetKind[]
  label: string
  className?: string
  /** Called when the user clicks "Cargar datos". Receives the raw File. */
  onLoadData?: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [currentFile, setCurrentFile] = useState<File>()
  const [metadata, setMetadata] = useState<SpreadsheetMetadata>()
  const [selectedSheetName, setSelectedSheetName] = useState("")
  const [error, setError] = useState("")
  const [isReading, setIsReading] = useState(false)

  const selectedSheet =
    metadata?.sheets.find((sheet) => sheet.name === selectedSheetName) ??
    metadata?.sheets[0]

  async function handleFile(file: File) {
    setError("")
    setMetadata(undefined)
    setSelectedSheetName("")
    setCurrentFile(undefined)
    setIsReading(true)

    try {
      const nextMetadata = await readSpreadsheetMetadata(file, allowedKinds)
      setMetadata(nextMetadata)
      setCurrentFile(file)
      setSelectedSheetName(nextMetadata.sheets[0]?.name ?? "")
    } catch (readError) {
      setError(
        readError instanceof Error
          ? readError.message
          : "No se pudo leer el archivo.",
      )
    } finally {
      setIsReading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  function clearFile() {
    setMetadata(undefined)
    setCurrentFile(undefined)
    setSelectedSheetName("")
    setError("")
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={allowedKinds.includes("csv") ? ".xlsx,.csv" : ".xlsx"}
        className="sr-only"
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            void handleFile(file)
          }
        }}
      />

      {isReading ? (
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LoaderCircle className="animate-spin" />
            </EmptyMedia>
            <EmptyTitle>Leyendo archivo</EmptyTitle>
            <EmptyDescription>
              Estamos preparando una muestra para que puedas revisar su estructura.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : metadata && selectedSheet ? (
        <SpreadsheetPreview
          metadata={metadata}
          selectedSheet={selectedSheet}
          selectedSheetName={selectedSheetName}
          onSelectSheet={setSelectedSheetName}
          onReplace={() => inputRef.current?.click()}
          onClear={clearFile}
          onLoadData={currentFile && onLoadData ? () => onLoadData(currentFile) : undefined}
        />
      ) : (
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconCloud />
            </EmptyMedia>
            <EmptyTitle>Aún no hay un archivo cargado</EmptyTitle>
            <EmptyDescription>
              Carga un {allowedKinds.includes("csv") ? "XLSX o CSV" : "XLSX"} para
              revisar sus hojas, columnas y primeras filas.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              {label}
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>No se pudo cargar el archivo</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

function SpreadsheetPreview({
  metadata,
  selectedSheet,
  selectedSheetName,
  onSelectSheet,
  onReplace,
  onClear,
  onLoadData,
}: {
  metadata: SpreadsheetMetadata
  selectedSheet: SpreadsheetMetadata["sheets"][number]
  selectedSheetName: string
  onSelectSheet: (sheetName: string) => void
  onReplace: () => void
  onClear: () => void
  onLoadData?: () => void
}) {
  const [headerRow = [], ...bodyRows] = selectedSheet.preview

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-background">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileSpreadsheet />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{metadata.fileName}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{formatFileSize(metadata.fileSize)}</span>
              <Badge variant="secondary">{metadata.kind.toUpperCase()}</Badge>
              <span>
                {metadata.sheets.length}{" "}
                {metadata.sheets.length === 1 ? "hoja" : "hojas"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onLoadData ? (
            <Button type="button" size="sm" onClick={onLoadData}>
              Cargar datos
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={onReplace}>
            <RefreshCw data-icon="inline-start" />
            Reemplazar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClear}
            aria-label="Quitar archivo"
            title="Quitar archivo"
          >
            <X />
          </Button>
        </div>
      </div>

      <Separator />
      <div className="flex flex-col gap-3 bg-muted/20 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Vista previa</p>
            <p className="text-xs text-muted-foreground">
              {selectedSheet.rowCount.toLocaleString("es-PE")} filas ·{" "}
              {selectedSheet.columnCount.toLocaleString("es-PE")} columnas
            </p>
          </div>

          {metadata.sheets.length > 1 ? (
            <Select value={selectedSheetName} onValueChange={onSelectSheet}>
              <SelectTrigger size="sm" aria-label="Seleccionar hoja">
                <SelectValue placeholder="Selecciona una hoja" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {metadata.sheets.map((sheet) => (
                    <SelectItem key={sheet.name} value={sheet.name}>
                      {sheet.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline">{selectedSheet.name}</Badge>
          )}
        </div>

        {headerRow.length > 0 ? (
          <div className="max-h-72 overflow-auto rounded-lg border bg-background">
            <Table>
              <TableHeader className="sticky top-0 bg-muted">
                <TableRow>
                  {headerRow.map((cell, columnIndex) => (
                    <TableHead key={`${columnIndex}-${cell}`} className="max-w-56">
                      <span className="block truncate">
                        {cell || `Columna ${columnIndex + 1}`}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {bodyRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {headerRow.map((_, columnIndex) => (
                      <TableCell
                        key={columnIndex}
                        className="max-w-56 text-muted-foreground"
                      >
                        <span className="block truncate">
                          {row[columnIndex] || "—"}
                        </span>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty className="min-h-40 border">
            <EmptyHeader>
              <EmptyTitle>La hoja está vacía</EmptyTitle>
              <EmptyDescription>
                Selecciona otra hoja o reemplaza el archivo.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        <p className="text-xs text-muted-foreground">
          Esta es una muestra local. Los datos todavía no se importaron ni guardaron.
        </p>
      </div>

      {metadata.warnings.length > 0 ? (
        <>
          <Separator />
          <div className="p-4">
            <Alert>
              <AlertCircle />
              <AlertTitle>El archivo contiene advertencias</AlertTitle>
              <AlertDescription>
                {metadata.warnings.join(" ")}
              </AlertDescription>
            </Alert>
          </div>
        </>
      ) : null}
    </div>
  )
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
