import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import {
  ensureBackendSeeded,
  NotFoundError,
  overhaulService,
} from "@workspace/backend"
import type { OverhaulTarifasData } from "@workspace/backend/types/overhaul"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import { TarifaRepuestosView } from "./tarifa-repuestos-view"
import { formatMoney } from "@/app/(dashboard)/overhaul/[id]/tarifas/components/tarifa-summary";
  
export default async function MonitorTarifaRepuestosPage({
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

  const partsSubtotal = tarifas.partes.reduce(
    (total, parte) => total + parte.subtotal,
    0,
  )

  return (
    <section className="mx-auto w-full space-y-8 pb-12">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/monitor/${id}/tarifas`}>
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
            Detalle de partes asociado a esta tarifa.
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

      <TarifaRepuestosView partes={tarifas.partes} />
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
