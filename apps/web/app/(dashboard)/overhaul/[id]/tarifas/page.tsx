import Link from "next/link"
import { notFound } from "next/navigation"
import { PackageSearch } from "lucide-react"

import {
  ensureBackendSeeded,
  NotFoundError,
  overhaulService,
} from "@workspace/backend"
import type { OverhaulTarifasData } from "@workspace/backend/types/overhaul"
import { Button } from "@workspace/ui/components/button"
import { SpreadsheetUpload } from "@/components/spreadsheet-upload"

import { TarifaSummary } from "./tarifa-summary"
import { TarifasForm } from "./tarifas-form"

export default async function OverhaulTarifasPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await ensureBackendSeeded()

  let tarifas: OverhaulTarifasData

  try {
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

  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 pb-24">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Etapa 3 · Tarifas</p>
        <h1 className="text-2xl font-semibold tracking-tight">Construcción de tarifa</h1>
        <p className="max-w-2xl text-muted-foreground">
          Organiza los trabajos por grupo y consolida sus costos para la propuesta.
        </p>
      </div>

      <TarifaSummary tarifas={tarifas} />

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Archivo de trabajo</h2>
          <p className="text-sm text-muted-foreground">
            Revisa la estructura del XLSX antes de definir su importación.
          </p>
        </div>
        <SpreadsheetUpload allowedKinds={["xlsx"]} label="Cargar XLSX" />
      </div>

      <TarifasForm overhaulId={id} initialTarifas={tarifas} />

      <Button asChild className="fixed right-6 bottom-6 z-30 shadow-lg">
        <Link href={`/overhaul/${id}/tarifas/repuestos`}>
          <PackageSearch data-icon="inline-start" />
          Repuestos
        </Link>
      </Button>
    </section>
  )
}
