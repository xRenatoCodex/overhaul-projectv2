import { notFound } from "next/navigation"

import {
  ensureBackendSeeded,
  masterDataService,
  NotFoundError,
  overhaulService,
} from "@workspace/backend"
import type {
  OverhaulAlcanceData,
  OverhaulNecesidadData,
} from "@workspace/backend/types/overhaul"

import { AlcanceForm } from "./components/alcance-form"

export default async function OverhaulAlcancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await ensureBackendSeeded()

  let alcance: OverhaulAlcanceData
  let necesidad: OverhaulNecesidadData

  try {
    const [alcanceData, necesidadData] = await Promise.all([
      overhaulService.getStageData(id, "alcance"),
      overhaulService.getStageData(id, "necesidad"),
    ])
    alcance = alcanceData as OverhaulAlcanceData
    necesidad = necesidadData as OverhaulNecesidadData
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound()
    }
    throw error
  }

  const [masterOptions, masterSystems] = await Promise.all([
    masterDataService.getOptions(),
    alcance.systems.length === 0
      ? masterDataService.getSystemsByModels(
        necesidad.maquinas.map(({ model }) => model),
      )
      : Promise.resolve(alcance.systems),
  ])

  return (
    <section className=" w-full h-auto space-y-8 pb-24">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Etapa 2 · Alcance</p>
        <h1 className="text-2xl font-semibold tracking-tight">Sistemas y componentes</h1>
        <p className="max-w-2xl text-muted-foreground">
          Define los sistemas y componentes que formarán parte del overhaul.
        </p>
      </div>

      <AlcanceForm
        overhaulId={id}
        initialSystems={masterSystems}
        talleres={masterOptions.talleres}
        atenciones={masterOptions.atenciones}
        version={alcance.version}
        isCompleted={alcance.isCompleted}
      />
    </section>
  )
}
