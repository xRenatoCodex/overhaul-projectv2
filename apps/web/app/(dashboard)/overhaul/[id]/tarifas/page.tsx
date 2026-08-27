import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { PackageSearch } from "lucide-react"

import {
  ensureBackendSeeded,
  NotFoundError,
  overhaulService,
} from "@workspace/backend"
import type { OverhaulTarifasData } from "@workspace/backend/types/overhaul"
import { Button } from "@workspace/ui/components/button"

import { TarifaSummary } from "./components/tarifa-summary"
import { TarifasForm } from "./components/tarifas-form"
import {
  getBlockedStageRedirect,
  getStageAccess,
  type StageAccess,
} from "../stage-access"

export default async function OverhaulTarifasPage({
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

  return (
    <section className=" w-full h-auto space-y-8 pb-24">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Etapa 3 · Tarifas</p>
        <h1 className="text-2xl font-semibold tracking-tight">Construcción de tarifa</h1>
        <p className="max-w-2xl text-muted-foreground">
          Organiza los trabajos por grupo y consolida sus costos para la propuesta.
        </p>
      </div>

      <TarifaSummary tarifas={tarifas} />

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
