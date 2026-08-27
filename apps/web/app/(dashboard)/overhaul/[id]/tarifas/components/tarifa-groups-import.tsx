"use client"

import { useRef, useState } from "react"
import { FileSpreadsheet, LoaderCircle, Upload } from "lucide-react"

import type { TarifaGroupJob } from "@workspace/backend/types/overhaul"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { parseTarifaGroups } from "@/lib/spreadsheets/parse-tarifa-groups"
import { readXlsxSheetRaw } from "@/lib/spreadsheets/read-xlsx-sheet-raw"

const TARIFA_SHEET = "Resumen"

type Props = {
  onImport: (groups: Omit<TarifaGroupJob, "id">[]) => void
}

export function TarifaGroupsImport({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState("")
  const [warnings, setWarnings] = useState<string[]>([])
  const [preview, setPreview] = useState<Omit<TarifaGroupJob, "id">[] | null>(null)

  function reset() {
    setError("")
    setWarnings([])
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function handleFile(file: File) {
    reset()
    setIsReading(true)

    try {
      const rows = await readXlsxSheetRaw(file, TARIFA_SHEET)
      const { groups, warnings: parseWarnings } = parseTarifaGroups(rows)
      setWarnings(parseWarnings)
      setPreview(groups)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el archivo.")
    } finally {
      setIsReading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function handleConfirm() {
    if (!preview) return
    onImport(preview)
    setOpen(false)
    reset()
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  const groupCount = preview?.length ?? 0
  const jobCount = preview?.reduce((sum, g) => sum + g.jobs.length, 0) ?? 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Upload data-icon="inline-start" />
          Importar desde XLSX
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar grupos y jobs</DialogTitle>
          <DialogDescription>
            Carga el XLSX de tarifa. Se leerá la hoja{" "}
            <strong className="font-medium">&quot;{TARIFA_SHEET}&quot;</strong> a partir de
            la fila 27 para extraer los grupos y sus jobs.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="sr-only"
          aria-label="Seleccionar XLSX"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />

        {isReading ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin shrink-0" />
            Leyendo archivo…
          </div>
        ) : preview ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-4 py-3">
              <FileSpreadsheet className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">
                  {groupCount} {groupCount === 1 ? "grupo" : "grupos"} ·{" "}
                  {jobCount} {jobCount === 1 ? "job" : "jobs"}
                </p>
                <p className="text-muted-foreground">
                  Hoja &quot;{TARIFA_SHEET}&quot; parseada correctamente
                </p>
              </div>
            </div>

            {preview.length > 0 && (
              <ul className="max-h-48 overflow-y-auto rounded-md border divide-y text-sm">
                {preview.map((group, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate font-medium">{group.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {group.jobs.length} jobs · {group.horas} HH
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {warnings.length > 0 && (
              <Alert variant="default" className="text-sm">
                <AlertTitle>Advertencias ({warnings.length})</AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 space-y-0.5 text-xs">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error al leer el archivo</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed py-8 text-center">
            <FileSpreadsheet className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Selecciona el archivo XLSX de tarifa
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Elegir archivo
            </Button>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {preview ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                Cambiar archivo
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                disabled={groupCount === 0}
              >
                Importar {groupCount} {groupCount === 1 ? "grupo" : "grupos"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
