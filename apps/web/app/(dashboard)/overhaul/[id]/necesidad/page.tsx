import { notFound } from "next/navigation"

import {
  ensureBackendSeeded,
  masterDataService,
  NotFoundError,
  overhaulService,
} from "@workspace/backend"
import type { OverhaulNecesidadData } from "@workspace/backend/types/overhaul"

import { NecesidadForm } from "./components/necesidad-form"

export default async function OverhaulNecesidadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await ensureBackendSeeded()

  let necesidad: OverhaulNecesidadData

  try {
    necesidad = (await overhaulService.getStageData(
      id,
      "necesidad",
    )) as OverhaulNecesidadData
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound()
    }
    throw error
  }

  const masterData = await masterDataService.getOptions()

  return (
    <section className=" w-full h-auto space-y-8 pb-24">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Etapa 1 · Necesidad</p>
        <h1 className="text-2xl font-semibold tracking-tight">Editar necesidad</h1>
      </div>
      <NecesidadForm
        overhaulId={id}
        initialNecesidad={necesidad}
        masterData={masterData}
      />
    </section>
  )
}
