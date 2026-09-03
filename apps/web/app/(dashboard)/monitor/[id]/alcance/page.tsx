import { notFound } from "next/navigation"

import {
  ensureBackendSeeded,
  NotFoundError,
  overhaulService,
} from "@workspace/backend"
import type { OverhaulAlcanceData } from "@workspace/backend/types/overhaul"

import { StageHeaderInfo } from "@/components/stage-header-info"
import { AlcanceView } from "./alcance-view"

export default async function MonitorAlcancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await ensureBackendSeeded()

  let alcance: OverhaulAlcanceData

  try {
    alcance = (await overhaulService.getStageData(
      id,
      "alcance",
    )) as OverhaulAlcanceData
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound()
    }
    throw error
  }

  return (
    <section className="relative w-full h-full space-y-8">
      <div className="space-y-1 pr-48">
        <p className="text-sm font-medium text-muted-foreground">Etapa 2 · Alcance</p>
        <h1 className="text-2xl font-semibold tracking-tight">Sistemas y componentes</h1>
        <p className="max-w-2xl text-muted-foreground">
          Sistemas y componentes definidos para el overhaul.
        </p>
      </div>
      <StageHeaderInfo
        version={alcance.version}
        createdBy={alcance.createdBy}
        createdAt={alcance.createdAt}
        updatedAt={alcance.updatedAt}
      />

      <AlcanceView systems={alcance.systems} />
    </section>
  )
}
