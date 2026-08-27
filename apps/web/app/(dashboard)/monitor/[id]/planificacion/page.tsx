import { notFound } from "next/navigation"

import {
  ensureBackendSeeded,
  NotFoundError,
  overhaulService,
} from "@workspace/backend"
import type { OverhaulPlanificacionData } from "@workspace/backend/types/overhaul"

import { ReadOnlyField } from "@/components/read-only-field"
import { formatDate } from "@/lib/format-date"

export default async function MonitorPlanificacionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await ensureBackendSeeded()

  let planificacion: OverhaulPlanificacionData

  try {
    planificacion = (await overhaulService.getStageData(
      id,
      "planificacion",
    )) as OverhaulPlanificacionData
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound()
    }
    throw error
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Etapa 5 · Planificación</p>
        <h1 className="text-2xl font-semibold tracking-tight">Planificación de ejecución</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <ReadOnlyField
          label="Estado"
          value={planificacion.isCompleted ? "Completado" : "Pendiente"}
        />
        <ReadOnlyField label="Versión" value={String(planificacion.version)} />
        <ReadOnlyField
          label="Fecha de inicio"
          value={planificacion.fechaInicio ? formatDate(planificacion.fechaInicio) : "Sin definir"}
        />
        <ReadOnlyField
          label="Fecha de fin"
          value={planificacion.fechaFin ? formatDate(planificacion.fechaFin) : "Sin definir"}
        />
      </div>
    </section>
  )
}
