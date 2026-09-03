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

import { StageHeaderInfo } from "@/components/stage-header-info"
import { TarifaGroupsView } from "./tarifa-groups-view"
import { TarifaSummary } from "@/app/(dashboard)/overhaul/[id]/tarifas/components/tarifa-summary"

export default async function MonitorTarifasPage({
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
    <section className="relative w-full space-y-8 overflow-hidden">
      <div className="space-y-1 pr-48">
        <p className="text-sm font-medium text-muted-foreground">Etapa 3 · Tarifas</p>
        <h1 className="text-2xl font-semibold tracking-tight">Construcción de tarifa</h1>
        <p className="max-w-2xl text-muted-foreground">
          Trabajos por grupo y sus costos consolidados para la propuesta.
        </p>
      </div>
      <StageHeaderInfo
        version={tarifas.version}
        createdBy={tarifas.createdBy}
        createdAt={tarifas.createdAt}
        updatedAt={tarifas.updatedAt}
      />

      <TarifaSummary tarifas={tarifas} />

      <div>
        <h2 className="text-base font-semibold">Grupos y jobs</h2>
        <p className="text-sm text-muted-foreground">
          Trabajos organizados por grupo con sus costos y horas.
        </p>
      </div>

      <TarifaGroupsView groups={tarifas.groups} currency={tarifas.currency} />

      <Button asChild className="fixed right-6 bottom-6 z-30 shadow-lg">
        <Link href={`/monitor/${id}/tarifas/repuestos`}>
          <PackageSearch data-icon="inline-start" />
          Repuestos
        </Link>
      </Button>
    </section>
  )
}
