import type { OverhaulStage } from "@workspace/backend/types/overhaul"

export type OverhaulsCreatedByMonthPoint = {
  month: string
  label: string
  count: number
}

export type OverhaulsByStatusPoint = {
  stage: OverhaulStage | "completado"
  label: string
  count: number
}

export type ClosureTimeByAreaPoint = {
  stage: OverhaulStage
  label: string
  averageDays: number | null
  sampleSize: number
}

export type TarifaAmountByCurrency = {
  currency: "USD" | "PEN"
  average: number
  count: number
}

export type OverhaulsSummaryMetrics = {
  totalOverhauls: number
  averagePropuestaClosureDays: number | null
  propuestaSampleSize: number
  averageTarifaAmountByCurrency: TarifaAmountByCurrency[]
}
