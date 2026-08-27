"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react"

import type { TarifaGroupJob, TarifaParte } from "@workspace/backend/types/overhaul"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { parseTarifaGroups } from "@/lib/spreadsheets/parse-tarifa-groups"
import { parseTarifaRepuestos } from "@/lib/spreadsheets/parse-tarifa-repuestos"
import { readXlsxSheetRaw } from "@/lib/spreadsheets/read-xlsx-sheet-raw"
import { TarifaGroupsTab } from "./tarifa-groups-tab"
import { TarifaRepuestosTab } from "./tarifa-repuestos-tab"

// ---------------------------------------------------------------------------
// Constants & types
// ---------------------------------------------------------------------------

const GROUPS_SHEET = "Resumen"
const REPUESTOS_SHEET = "Partes Maquina"
const SOURCE_CURRENCY = "USD" as const

type Currency = "USD" | "PEN"
type ParsedGroups = Omit<TarifaGroupJob, "id">[]
type ParsedPartes = Omit<TarifaParte, "id">[]

type ParseState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready"
      groupWarnings: string[]
      partesWarnings: string[]
    }

type SaveState = { status: "idle" } | { status: "saving" } | { status: "error"; message: string }

type Props = {
  overhaulId: string
  file: File
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: (currency: Currency) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TarifaLoadDataModal({
  overhaulId,
  file,
  open,
  onOpenChange,
  onImported,
}: Props) {
  const [parseState, setParseState] = useState<ParseState>({ status: "idle" })
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" })

  const [targetCurrency, setTargetCurrency] = useState<Currency>(SOURCE_CURRENCY)
  const [exchangeRate, setExchangeRate] = useState<number>(3.7)

  const [groups, setGroups] = useState<ParsedGroups>([])
  const [partes, setPartes] = useState<ParsedPartes>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())

  // ── Parse on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    setParseState({ status: "loading" })
    setSaveState({ status: "idle" })
    setExpandedGroups(new Set())
    setTargetCurrency(SOURCE_CURRENCY)

    void (async () => {
      try {
        const [groupRows, partesRows] = await Promise.all([
          readXlsxSheetRaw(file, GROUPS_SHEET).catch(() => null),
          readXlsxSheetRaw(file, REPUESTOS_SHEET).catch(() => null),
        ])

        const { groups: pg, warnings: gw } = groupRows
          ? parseTarifaGroups(groupRows)
          : { groups: [], warnings: [`No se encontró la hoja "${GROUPS_SHEET}".`] }

        const { partes: pp, warnings: pw } = partesRows
          ? parseTarifaRepuestos(partesRows)
          : { partes: [], warnings: [`No se encontró la hoja "${REPUESTOS_SHEET}".`] }

        setGroups(pg)
        setPartes(pp)
        setParseState({ status: "ready", groupWarnings: gw, partesWarnings: pw })
      } catch (err) {
        setParseState({
          status: "error",
          message: err instanceof Error ? err.message : "Error al procesar el archivo.",
        })
      }
    })()
  }, [open, file])

  // ── Group / job editors ────────────────────────────────────────────────────
  function toggleGroup(index: number) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  function updateGroupName(i: number, name: string) {
    setGroups((prev) => prev.map((g, idx) => (idx === i ? { ...g, name } : g)))
  }

  function updateGroupHoras(i: number, value: string) {
    const horas = Math.max(0, Number(value) || 0)
    setGroups((prev) => prev.map((g, idx) => (idx === i ? { ...g, horas } : g)))
  }

  function updateJobName(gi: number, ji: number, name: string) {
    setGroups((prev) =>
      prev.map((g, gIdx) =>
        gIdx === gi
          ? { ...g, jobs: g.jobs.map((j, jIdx) => (jIdx === ji ? { ...j, name } : j)) }
          : g,
      ),
    )
  }

  function updateJobField(
    gi: number,
    ji: number,
    field: "materialAndMo" | "miscelaneos" | "repuestos",
    value: string,
  ) {
    const num = Math.max(0, Number(value) || 0)
    setGroups((prev) =>
      prev.map((g, gIdx) =>
        gIdx === gi
          ? { ...g, jobs: g.jobs.map((j, jIdx) => (jIdx === ji ? { ...j, [field]: num } : j)) }
          : g,
      ),
    )
  }

  function updateParte(index: number, updated: Omit<TarifaParte, "id">) {
    setPartes((prev) => prev.map((p, i) => (i === index ? updated : p)))
  }

  // ── Currency conversion ────────────────────────────────────────────────────
  function applyRate(v: number) {
    return targetCurrency === SOURCE_CURRENCY ? round2(v) : round2(v * exchangeRate)
  }

  function convertGroups(src: ParsedGroups): ParsedGroups {
    if (targetCurrency === SOURCE_CURRENCY) return src
    return src.map((g) => ({
      ...g,
      jobs: g.jobs.map((j) => ({
        ...j,
        materialAndMo: applyRate(j.materialAndMo),
        miscelaneos: applyRate(j.miscelaneos),
        repuestos: applyRate(j.repuestos),
      })),
    }))
  }

  function convertPartes(src: ParsedPartes): ParsedPartes {
    if (targetCurrency === SOURCE_CURRENCY) return src
    return src.map((p) => ({
      ...p,
      dealerNet: applyRate(p.dealerNet),
      costoInterno: applyRate(p.costoInterno),
      pu: applyRate(p.pu),
      subtotal: applyRate(p.subtotal),
    }))
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleConfirm() {
    setSaveState({ status: "saving" })

    const finalGroups = convertGroups(groups).map((g, pos) => ({
      ...g,
      position: pos,
      jobs: g.jobs.map((j, p) => ({ ...j, position: p })),
    }))
    const finalPartes = convertPartes(partes).map((p, pos) => ({ ...p, position: pos }))

    try {
      const [tarifasRes, repuestosRes] = await Promise.all([
        fetch(`/api/overhaul/${overhaulId}/tarifas`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currency: targetCurrency, groups: finalGroups }),
        }),
        fetch(`/api/overhaul/${overhaulId}/tarifas/repuestos`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partes: finalPartes }),
        }),
      ])

      const [tj, rj] = await Promise.all([tarifasRes.json(), repuestosRes.json()])

      if (!tarifasRes.ok) throw new Error(tj.details?.[0] ?? tj.error ?? "Error al guardar grupos.")
      if (!repuestosRes.ok) throw new Error(rj.details?.[0] ?? rj.error ?? "Error al guardar repuestos.")

      onImported(targetCurrency)
      onOpenChange(false)
    } catch (err) {
      setSaveState({
        status: "error",
        message: err instanceof Error ? err.message : "Error desconocido al guardar.",
      })
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const isSaving = saveState.status === "saving"
  const groupCount = groups.length
  const jobCount = groups.reduce((s, g) => s + g.jobs.length, 0)
  const partesCount = partes.length
  const warnings =
    parseState.status === "ready"
      ? [...parseState.groupWarnings, ...parseState.partesWarnings]
      : []

  return (
    <Dialog open={open} onOpenChange={isSaving ? undefined : onOpenChange}>
      <DialogContent className="flex h-[94vh] max-h-[94vh] w-[75vw] sm:max-w-[75vw] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-8 py-4">
          <DialogTitle>Cargar datos desde {file.name}</DialogTitle>
          <DialogDescription>
            El documento está en <strong className="font-medium">USD</strong>. Selecciona la moneda
            de destino antes de importar; los valores se convertirán automáticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Currency bar */}
        {parseState.status === "ready" && (
          <div className="flex shrink-0 items-center gap-6 border-b bg-muted/30 px-8 py-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Moneda de destino</Label>
              <Select
                value={targetCurrency}
                onValueChange={(v) => setTargetCurrency(v as Currency)}
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="USD">USD · Dólar</SelectItem>
                    <SelectItem value="PEN">PEN · Sol</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {targetCurrency === "PEN" && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Tipo de cambio</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Math.max(0.01, Number(e.target.value) || 0.01))}
                  className="h-8 w-24 text-right text-sm"
                />
                <span className="text-xs text-muted-foreground">PEN / USD</span>
              </div>
            )}

            {targetCurrency === "PEN" && (
              <span className="text-xs text-muted-foreground">
                Los valores numéricos se multiplicarán × {exchangeRate} al importar.
              </span>
            )}
          </div>
        )}

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {parseState.status === "loading" ? (
            <div className="flex h-full items-center justify-center gap-3 text-sm text-muted-foreground">
              <LoaderCircle className="size-5 animate-spin" />
              Procesando hojas del archivo…
            </div>
          ) : parseState.status === "error" ? (
            <div className="p-8">
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>No se pudo leer el archivo</AlertTitle>
                <AlertDescription>{parseState.message}</AlertDescription>
              </Alert>
            </div>
          ) : parseState.status === "ready" ? (
            <Tabs defaultValue="groups" className="flex h-full flex-col">
              <div className="shrink-0 border-b px-8 pt-4">
                <TabsList className="gap-1">
                  <TabsTrigger value="groups" className="gap-2">
                    Grupos y jobs
                    <Badge variant="secondary">
                      {groupCount}G · {jobCount}J
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="partes" className="gap-2">
                    Repuestos
                    <Badge variant="secondary">{partesCount.toLocaleString("es-PE")}</Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="groups"
                className="mt-0 min-h-0 flex-1 overflow-y-auto px-8 py-5"
              >
                <TarifaGroupsTab
                  groups={groups}
                  expandedGroups={expandedGroups}
                  warnings={warnings}
                  onToggleGroup={toggleGroup}
                  onGroupNameChange={updateGroupName}
                  onGroupHorasChange={updateGroupHoras}
                  onJobNameChange={updateJobName}
                  onJobFieldChange={updateJobField}
                />
              </TabsContent>

              <TabsContent
                value="partes"
                className="mt-0 min-h-0 flex-1 overflow-y-auto px-8 py-5"
              >
                <TarifaRepuestosTab partes={partes} onParteChange={updateParte} />
              </TabsContent>
            </Tabs>
          ) : null}
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 border-t px-8 py-4">
          {parseState.status === "ready" && (
            <>
              <div className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
                {saveState.status === "error" && (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="size-3.5" />
                    {saveState.message}
                  </span>
                )}
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Importar y guardar
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}