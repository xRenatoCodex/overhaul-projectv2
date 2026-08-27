import { notFound, redirect } from "next/navigation"

import { NotFoundError } from "@workspace/backend"

import { SectionContent } from "@/components/section-content"
import {
  getBlockedStageRedirect,
  getStageAccess,
  type StageAccess,
} from "../stage-access"

export default async function OverhaulPlanificacionPage({
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

  const blockedRedirect = getBlockedStageRedirect(id, "planificacion", stageAccess)
  if (blockedRedirect) {
    redirect(blockedRedirect)
  }

  return (
    <SectionContent
      title="Overhaul - Planificacion"
      description="Planificacion detallada para la ejecucion del overhaul seleccionado."
    />
  )
}
