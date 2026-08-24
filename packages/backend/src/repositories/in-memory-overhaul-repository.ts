import { randomUUID } from "node:crypto"

import { OverhaulEntity } from "@workspace/backend/entities/overhaul"
import type { IOverhaulRepository } from "@workspace/backend/interfaces/repositories"
import type {
  CreateNecesidadInput,
  DomainArea,
  MonitorItem,
  OverhaulStage,
} from "@workspace/backend/types/overhaul"

const monitorStageByArea: Record<DomainArea, OverhaulStage> = {
  comercial: "necesidad",
  tarifas: "tarifas",
  planificacion: "planificacion",
}

export class InMemoryOverhaulRepository implements IOverhaulRepository {
  private readonly overhauls = new Map<string, OverhaulEntity>()

  constructor(seedOverhauls: OverhaulEntity[]) {
    for (const overhaul of seedOverhauls) {
      this.overhauls.set(overhaul.id, overhaul)
    }
  }

  public async createFromNecesidad(
    input: CreateNecesidadInput,
  ): Promise<OverhaulEntity> {
    const now = new Date().toISOString()
    const id = randomUUID()
    const overhaul = OverhaulEntity.createFromNecesidad(id, input, now)
    this.overhauls.set(overhaul.id, overhaul)
    return overhaul
  }

  public async findById(id: string): Promise<OverhaulEntity | undefined> {
    return this.overhauls.get(id)
  }

  public async save(overhaul: OverhaulEntity): Promise<void> {
    this.overhauls.set(overhaul.id, overhaul)
  }

  public async saveTarifas(overhaul: OverhaulEntity): Promise<void> {
    this.overhauls.set(overhaul.id, overhaul)
  }

  public async saveTarifaRepuestos(overhaul: OverhaulEntity): Promise<void> {
    this.overhauls.set(overhaul.id, overhaul)
  }

  public async listMonitor(area: DomainArea): Promise<MonitorItem[]> {
    const stageKey = monitorStageByArea[area]
    const entries = Array.from(this.overhauls.values())
    return entries.map((overhaul) => {
      const stageData = overhaul.stages[stageKey]
      return {
        overhaulId: overhaul.id,
        proyecto: overhaul.stages.necesidad.proyecto,
        stage: stageKey,
        version: stageData.version,
        isCompleted: stageData.isCompleted,
        updatedAt: stageData.updatedAt,
      }
    })
  }
}
