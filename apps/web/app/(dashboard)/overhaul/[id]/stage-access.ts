import { ensureBackendSeeded, overhaulService } from "@workspace/backend"
import type {
  OverhaulAlcanceData,
  OverhaulPropuestaData,
  OverhaulTarifasData,
} from "@workspace/backend/types/overhaul"

export type StageAccess = {
  necesidad: true
  alcance: true
  tarifas: boolean
  propuesta: boolean
  planificacion: boolean
}

type GatedStage = "tarifas" | "propuesta" | "planificacion"

export async function getStageAccess(overhaulId: string): Promise<StageAccess> {
  await ensureBackendSeeded()

  const [alcance, tarifas, propuesta] = (await Promise.all([
    overhaulService.getStageData(overhaulId, "alcance"),
    overhaulService.getStageData(overhaulId, "tarifas"),
    overhaulService.getStageData(overhaulId, "propuesta"),
  ])) as [OverhaulAlcanceData, OverhaulTarifasData, OverhaulPropuestaData]

  const tarifasEnabled = alcance.isCompleted
  const propuestaEnabled = tarifasEnabled && tarifas.isCompleted
  const planificacionEnabled = propuestaEnabled && propuesta.isCompleted

  return {
    necesidad: true,
    alcance: true,
    tarifas: tarifasEnabled,
    propuesta: propuestaEnabled,
    planificacion: planificacionEnabled,
  }
}

export function getBlockedStageRedirect(
  overhaulId: string,
  stage: GatedStage,
  stageAccess: StageAccess,
): string | null {
  if (stage === "tarifas" && !stageAccess.tarifas) {
    return `/overhaul/${overhaulId}/alcance`
  }

  if (stage === "propuesta" && !stageAccess.propuesta) {
    if (!stageAccess.tarifas) {
      return `/overhaul/${overhaulId}/alcance`
    }
    return `/overhaul/${overhaulId}/tarifas`
  }

  if (stage === "planificacion" && !stageAccess.planificacion) {
    if (!stageAccess.tarifas) {
      return `/overhaul/${overhaulId}/alcance`
    }
    if (!stageAccess.propuesta) {
      return `/overhaul/${overhaulId}/tarifas`
    }
    return `/overhaul/${overhaulId}/propuesta`
  }

  return null
}
