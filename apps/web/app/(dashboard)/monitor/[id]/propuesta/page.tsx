import { notFound } from "next/navigation"

import {
  ensureBackendSeeded,
  NotFoundError,
  overhaulService,
} from "@workspace/backend"
import type { OverhaulPropuestaData } from "@workspace/backend/types/overhaul"

import { ReadOnlyField } from "@/components/read-only-field"
import { StageHeaderInfo } from "@/components/stage-header-info"

export default async function MonitorPropuestaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await ensureBackendSeeded()

  let propuesta: OverhaulPropuestaData

  try {
    propuesta = (await overhaulService.getStageData(
      id,
      "propuesta",
    )) as OverhaulPropuestaData
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound()
    }
    throw error
  }

  return (
    <section className="relative mx-auto w-full max-w-5xl space-y-8">
      <div className="space-y-1 pr-48">
        <p className="text-sm font-medium text-muted-foreground">Etapa 4 · Propuesta</p>
        <h1 className="text-2xl font-semibold tracking-tight">Propuesta comercial</h1>
      </div>
      <StageHeaderInfo
        version={propuesta.version}
        createdBy={propuesta.createdBy}
        createdAt={propuesta.createdAt}
        updatedAt={propuesta.updatedAt}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <ReadOnlyField label="Estado" value={propuesta.isCompleted ? "Completado" : "Pendiente"} />
        <ReadOnlyField label="Versión" value={String(propuesta.version)} />
      </div>

      <ReadOnlyField
        label="Documento"
        value={propuesta.propuestaUri || "Sin documento"}
      />
    </section>
  )
}
