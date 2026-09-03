import type { IOverhaulRepository } from "@workspace/backend/interfaces/repositories"
import type { IOverhaulService } from "@workspace/backend/interfaces/services"
import type {
  CreateNecesidadInput,
  OverhaulHistory,
  OverhaulStage,
  OverhaulSummary,
  UpdateAlcanceInput,
  UpdatePropuestaInput,
  UpdateTarifaRepuestosInput,
  UpdateTarifasInput,
} from "@workspace/backend/types/overhaul"
import { NotFoundError } from "@workspace/backend/services/errors"

const stageOrder: OverhaulStage[] = [
  "necesidad",
  "alcance",
  "tarifas",
  "propuesta",
  "planificacion",
]

export class OverhaulService implements IOverhaulService {
  constructor(private readonly overhaulRepository: IOverhaulRepository) {}

  public async createNecesidad(
    input: CreateNecesidadInput,
    actor: string | null = null,
  ): Promise<{ id: string }> {
    const overhaul = await this.overhaulRepository.createFromNecesidad(
      input,
      actor,
    )
    return { id: overhaul.id }
  }

  public async updateNecesidad(
    id: string,
    input: CreateNecesidadInput,
    actor: string | null = null,
  ): Promise<{ id: string }> {
    const overhaul = await this.getOverhaul(id)
    const now = new Date().toISOString()

    overhaul.actor = actor
    overhaul.updateNecesidad(input, now)
    await this.overhaulRepository.save(overhaul)

    return { id: overhaul.id }
  }

  public async updateAlcance(
    id: string,
    input: UpdateAlcanceInput,
    actor: string | null = null,
  ): Promise<{ id: string }> {
    const overhaul = await this.getOverhaul(id)

    const now = new Date().toISOString()
    overhaul.actor = actor
    overhaul.updateAlcance(input, now)
    overhaul.markStageCompleted("alcance", now)
    await this.overhaulRepository.save(overhaul)
    return { id: overhaul.id }
  }

  public async updatePropuesta(
    id: string,
    input: UpdatePropuestaInput,
    actor: string | null = null,
  ): Promise<{ id: string }> {
    const overhaul = await this.getOverhaul(id)
    const now = new Date().toISOString()

    overhaul.actor = actor
    overhaul.updatePropuesta(input, now)
    overhaul.markStageCompleted("propuesta", now)
    await this.overhaulRepository.save(overhaul)

    return { id: overhaul.id }
  }

  public async updateTarifas(
    id: string,
    input: UpdateTarifasInput,
    actor: string | null = null,
  ) {
    const overhaul = await this.getOverhaul(id)

    const now = new Date().toISOString()
    overhaul.actor = actor
    overhaul.updateTarifas(input, now)
    overhaul.markStageCompleted("tarifas", now)
    await this.overhaulRepository.saveTarifas(overhaul)

    return { id: overhaul.id, tarifas: overhaul.stages.tarifas }
  }

  public async updateTarifaRepuestos(
    id: string,
    input: UpdateTarifaRepuestosInput,
    actor: string | null = null,
  ) {
    const overhaul = await this.getOverhaul(id)

    const now = new Date().toISOString()
    overhaul.actor = actor
    overhaul.updateTarifaRepuestos(input, now)
    overhaul.markStageCompleted("tarifas", now)
    await this.overhaulRepository.saveTarifaRepuestos(overhaul)

    return { id: overhaul.id, tarifas: overhaul.stages.tarifas }
  }

  public async getStageData(id: string, stage: OverhaulStage): Promise<unknown> {
    const overhaul = await this.getOverhaul(id)

    return overhaul.getStage(stage)
  }

  public async getSummary(id: string): Promise<OverhaulSummary> {
    const overhaul = await this.getOverhaul(id)

    const stages = stageOrder.map((stage) => {
      const data = overhaul.stages[stage]
      return {
        stage,
        version: data.version,
        isCompleted: data.isCompleted,
        updatedAt: data.updatedAt,
      }
    })

    return {
      overhaulId: overhaul.id,
      proyecto: overhaul.stages.necesidad.proyecto,
      cliente: overhaul.stages.necesidad.cliente,
      estado: overhaul.state,
      version: stages.reduce(
        (highest, stage) => Math.max(highest, stage.version),
        1,
      ),
      pendingStage: stages.find((stage) => !stage.isCompleted)?.stage ?? null,
      stages,
    }
  }

  public async getHistory(id: string): Promise<OverhaulHistory> {
    const history = await this.overhaulRepository.findHistory(id)
    if (!history) {
      throw new NotFoundError("Overhaul no encontrado")
    }

    return history
  }

  private async getOverhaul(id: string) {
    const overhaul = await this.overhaulRepository.findById(id)
    if (!overhaul) {
      throw new NotFoundError("Overhaul no encontrado")
    }

    return overhaul
  }
}
