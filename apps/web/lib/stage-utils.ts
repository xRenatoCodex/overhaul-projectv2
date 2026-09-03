import type { OverhaulStage } from "@workspace/backend/types/overhaul"

const STAGE_ORDER: OverhaulStage[] = [
  "necesidad",
  "alcance",
  "tarifas",
  "propuesta",
  "planificacion",
]

const STAGE_LABELS: Record<OverhaulStage, string> = {
  necesidad: "Necesidad",
  alcance: "Alcance",
  tarifas: "Tarifas",
  propuesta: "Propuesta",
  planificacion: "Planificación",
}

export function getNextStage(
  stages: Array<{ stage: OverhaulStage; isCompleted: boolean }>,
): OverhaulStage | "finalizada" {
  for (const stage of STAGE_ORDER) {
    const stageData = stages.find((s) => s.stage === stage)
    if (!stageData?.isCompleted) {
      return stage
    }
  }
  return "finalizada"
}

export function getStageLabel(stage: OverhaulStage | "finalizada"): string {
  if (stage === "finalizada") return "Finalizada"
  return STAGE_LABELS[stage] ?? stage
}
