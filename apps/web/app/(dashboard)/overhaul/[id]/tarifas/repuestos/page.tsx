import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import {
  ensureBackendSeeded,
  NotFoundError,
  overhaulService,
} from "@workspace/backend"
import type { OverhaulTarifasData } from "@workspace/backend/types/overhaul"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { SpreadsheetUpload } from "@/components/spreadsheet-upload"

import { TarifaRepuestosForm } from "./tarifa-repuestos-form"
import {
  getBlockedStageRedirect,
  getStageAccess,
  type StageAccess,
} from "../../stage-access"
import { formatMoney } from "../components/tarifa-summary";

export default async function TarifaRepuestosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let stageAccess: StageAccess

  try {
    stageAccess = await getStageAccess(id)
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound()
    }
    throw error
  }

  const blockedRedirect = getBlockedStageRedirect(id, "tarifas", stageAccess)
  if (blockedRedirect) {
    redirect(blockedRedirect)
  }

  let tarifas: OverhaulTarifasData

  try {
    await ensureBackendSeeded()
    tarifas = (await overhaulService.getStageData(
      id,
      "tarifas",
    )) as OverhaulTarifasData
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound()
    }
    throw error
  }

  const partsSubtotal = tarifas.partes.reduce(
    (total, parte) => total + parte.subtotal,
    0,
  )

  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/overhaul/${id}/tarifas`}>
            <ArrowLeft data-icon="inline-start" />
            Tarifas
          </Link>
        </Button>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            Etapa 3 · Tarifas
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Repuestos</h1>
          <p className="max-w-2xl text-muted-foreground">
            Mantén el detalle de partes asociado únicamente a esta tarifa.
          </p>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-3">
        <Metric label="Filas" value={tarifas.partes.length.toLocaleString("es-PE")} />
        <Metric
          label="Valor referencial"
          value={formatMoney(partsSubtotal, tarifas.currency)}
        />
        <div className="flex flex-col gap-2 bg-background px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">Estado</span>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Versión {tarifas.version}</Badge>
            <Badge variant="outline">{tarifas.currency}</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Archivo de repuestos</h2>
          <p className="text-sm text-muted-foreground">
            Inspecciona un XLSX o CSV. Las filas no se importarán todavía.
          </p>
        </div>
        <SpreadsheetUpload
          allowedKinds={["xlsx", "csv"]}
          label="Cargar XLSX o CSV"
        />
      </div>

      <TarifaRepuestosForm overhaulId={id} initialTarifas={tarifas} />
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 bg-background px-4 py-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  )
}