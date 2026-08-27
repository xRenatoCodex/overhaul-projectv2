import { notFound, redirect } from "next/navigation"

import { NotFoundError, overhaulService } from "@workspace/backend"
import type { OverhaulPropuestaData } from "@workspace/backend/types/overhaul"

import {
  getBlockedStageRedirect,
  getStageAccess,
  type StageAccess,
} from "../stage-access"
import { PropuestaForm } from "./components/propuesta-form"

export default async function OverhaulPropuestaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let stageAccess: StageAccess
  let propuesta: OverhaulPropuestaData

  try {
    stageAccess = await getStageAccess(id)
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

  const blockedRedirect = getBlockedStageRedirect(id, "propuesta", stageAccess)
  if (blockedRedirect) {
    redirect(blockedRedirect)
  }

  return (
    <section className=" w-full h-auto space-y-8 pb-24">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Etapa 4 · Propuesta</p>
        <h1 className="text-2xl font-semibold tracking-tight">Propuesta comercial</h1>
      </div>
      <PropuestaForm overhaulId={id} initialPropuesta={propuesta} />
    </section>
  )
}
