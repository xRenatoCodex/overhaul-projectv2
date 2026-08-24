import { notFound } from "next/navigation"

import {
  ensureBackendSeeded,
  NotFoundError,
  overhaulService,
} from "@workspace/backend"
import type { OverhaulNecesidadData } from "@workspace/backend/types/overhaul"
import { Separator } from "@workspace/ui/components/separator"

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

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Etapa 1 · Necesidad</p>
        <h1 className="text-2xl font-semibold tracking-tight">{necesidad.proyecto}</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <ReadOnlyField label="Cliente" value={necesidad.cliente} />
        <ReadOnlyField label="Estado" value={necesidad.isCompleted ? "Completado" : "Pendiente"} />
        <ReadOnlyField label="Ubicación" value={necesidad.ubicacion} />
        <ReadOnlyField label="Taller de destino" value={necesidad.tallerDestino} />
      </div>

      <Separator />

      <div className="grid gap-5 md:grid-cols-2">
        <ReadOnlyField
          label="Fecha estimada de reparación"
          value={formatDate(necesidad.fechaEstimada)}
        />
        <ReadOnlyField
          label="Fecha límite para tarifa"
          value={formatDate(necesidad.fechaTarifa)}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <h2 className="font-semibold">Máquinas incluidas</h2>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground uppercase">
                <th className="px-3 py-2">Modelo</th>
                <th className="px-3 py-2">Serie</th>
              </tr>
            </thead>
            <tbody>
              {necesidad.maquinas.map((machine, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{machine.model}</td>
                  <td className="px-3 py-2">{machine.serial}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="block text-sm font-medium text-muted-foreground">{label}</span>
      <span className="block text-sm">{value}</span>
    </div>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
