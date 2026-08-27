import type { PrismaClient } from "@prisma/client"

import type { OverhaulStage } from "@workspace/backend/types/overhaul"

import type {
  ClosureTimeByAreaPoint,
  OverhaulsByStatusPoint,
  OverhaulsCreatedByMonthPoint,
  OverhaulsSummaryMetrics,
  TarifaAmountByCurrency,
} from "@workspace/backend/metrics/types"

const stageOrder: OverhaulStage[] = [
  "necesidad",
  "alcance",
  "tarifas",
  "propuesta",
  "planificacion",
]

const stageLabels: Record<OverhaulStage | "completado", string> = {
  necesidad: "Necesidad",
  alcance: "Alcance",
  tarifas: "Tarifas",
  propuesta: "Propuesta",
  planificacion: "Planificación",
  completado: "Completado",
}

const monthLabelFormatter = new Intl.DateTimeFormat("es-PE", {
  month: "short",
  year: "numeric",
})

export class MetricsService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getOverhaulsCreatedByMonth(
    monthsBack = 12,
  ): Promise<OverhaulsCreatedByMonthPoint[]> {
    const overhauls = await this.prisma.overhaul.findMany({
      select: { createdAt: true },
    })

    const counts = new Map<string, number>()
    for (const { createdAt } of overhauls) {
      const key = monthKey(createdAt)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    const now = new Date()
    const points: OverhaulsCreatedByMonthPoint[] = []
    for (let offset = monthsBack - 1; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
      const key = monthKey(date)
      points.push({
        month: key,
        label: monthLabelFormatter.format(date),
        count: counts.get(key) ?? 0,
      })
    }

    return points
  }

  public async getOverhaulsByStatus(): Promise<OverhaulsByStatusPoint[]> {
    const overhauls = await this.prisma.overhaul.findMany({
      select: {
        necesidad: { select: { isCompleted: true } },
        alcance: { select: { isCompleted: true } },
        tarifas: { select: { isCompleted: true } },
        propuesta: { select: { isCompleted: true } },
        planificacion: { select: { isCompleted: true } },
      },
    })

    const counts = new Map<OverhaulStage | "completado", number>()
    for (const stage of [...stageOrder, "completado" as const]) {
      counts.set(stage, 0)
    }

    for (const overhaul of overhauls) {
      const activeStage = stageOrder.find(
        (stage) => !overhaul[stage]?.isCompleted,
      )
      const bucket = activeStage ?? "completado"
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
    }

    return [...stageOrder, "completado" as const].map((stage) => ({
      stage,
      label: stageLabels[stage],
      count: counts.get(stage) ?? 0,
    }))
  }

  public async getAverageClosureTimeByArea(): Promise<ClosureTimeByAreaPoint[]> {
    const overhauls = await this.prisma.overhaul.findMany({
      select: {
        createdAt: true,
        necesidad: { select: { completedAt: true } },
        alcance: { select: { completedAt: true } },
        tarifas: { select: { completedAt: true } },
        propuesta: { select: { completedAt: true } },
        planificacion: { select: { completedAt: true } },
      },
    })

    return stageOrder.map((stage) => {
      const stageIndex = stageOrder.indexOf(stage)
      const previousStage = stageOrder[stageIndex - 1]

      const days: number[] = []
      for (const overhaul of overhauls) {
        const completedAt = overhaul[stage]?.completedAt
        if (!completedAt) {
          continue
        }

        const reference = previousStage
          ? overhaul[previousStage]?.completedAt
          : overhaul.createdAt
        if (!reference) {
          continue
        }

        const diffMs = completedAt.getTime() - new Date(reference).getTime()
        days.push(diffMs / (1000 * 60 * 60 * 24))
      }

      return {
        stage,
        label: stageLabels[stage],
        averageDays: days.length > 0 ? average(days) : null,
        sampleSize: days.length,
      }
    })
  }

  public async getOverhaulsSummary(): Promise<OverhaulsSummaryMetrics> {
    const [totalOverhauls, propuestaClosures, tarifaGroups] = await Promise.all([
      this.prisma.overhaul.count(),
      this.prisma.overhaul.findMany({
        select: { createdAt: true, propuesta: { select: { completedAt: true } } },
        where: { propuesta: { completedAt: { not: null } } },
      }),
      this.prisma.overhaulTarifas.groupBy({
        by: ["currency"],
        _avg: { total: true },
        _count: { _all: true },
      }),
    ])

    const propuestaDays = propuestaClosures
      .map(({ createdAt, propuesta }) =>
        propuesta?.completedAt
          ? (propuesta.completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          : null,
      )
      .filter((value): value is number => value !== null)

    const averageTarifaAmountByCurrency: TarifaAmountByCurrency[] = tarifaGroups.map(
      (group) => ({
        currency: group.currency,
        average: group._avg.total?.toNumber() ?? 0,
        count: group._count._all,
      }),
    )

    return {
      totalOverhauls,
      averagePropuestaClosureDays:
        propuestaDays.length > 0 ? average(propuestaDays) : null,
      propuestaSampleSize: propuestaDays.length,
      averageTarifaAmountByCurrency,
    }
  }
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function average(values: number[]): number {
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}
