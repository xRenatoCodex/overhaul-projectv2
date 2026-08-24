"use client"

import { useRef, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  readSpreadsheetMetadata,
  type SpreadsheetKind,
  type SpreadsheetMetadata,
} from "@/lib/spreadsheets/read-spreadsheet-metadata"

export function SpreadsheetUpload({
  allowedKinds,
  label,
}: {
  allowedKinds: SpreadsheetKind[]
  label: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [metadata, setMetadata] = useState<SpreadsheetMetadata>()
  const [error, setError] = useState("")
  const [isReading, setIsReading] = useState(false)

  async function handleFile(file: File) {
    setError("")
    setMetadata(undefined)
    setIsReading(true)

    try {
      setMetadata(await readSpreadsheetMetadata(file, allowedKinds))
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
    setError("")
  }

  return (
    <div className="flex flex-col gap-3">
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

      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={isReading}
      >
        {isReading ? (
          <LoaderCircle data-icon="inline-start" className="animate-spin" />
        ) : (
          <Upload data-icon="inline-start" />
        )}
        {isReading ? "Leyendo archivo..." : label}
      </Button>

      {metadata ? (
        <div className="flex max-w-xl flex-col gap-3 rounded-md border p-3">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{metadata.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(metadata.fileSize)} · {metadata.kind.toUpperCase()}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={clearFile}
              aria-label="Quitar archivo"
              title="Quitar archivo"
            >
              <X />
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {metadata.sheets.map((sheet) => (
              <div key={sheet.name} className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">{sheet.name}</Badge>
                <span>{sheet.rowCount} filas</span>
                <span>{sheet.columnCount} columnas</span>
                {sheet.headers.length > 0 ? (
                  <span className="truncate text-muted-foreground">
                    {sheet.headers.join(" · ")}
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5" />
            Archivo leído localmente. Sus datos aún no se importaron.
          </p>
        </div>
      ) : null}

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

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
