import type { IOverhaulRepository } from "@workspace/backend/interfaces/repositories"
import type { IOverhaulService } from "@workspace/backend/interfaces/services"
import type {
  CreateNecesidadInput,
  OverhaulStage,
  UpdateAlcanceInput,
  UpdatePropuestaInput,
  UpdateTarifaRepuestosInput,
  UpdateTarifasInput,
} from "@workspace/backend/types/overhaul"
import { NotFoundError } from "@workspace/backend/services/errors"

export class OverhaulService implements IOverhaulService {
  constructor(private readonly overhaulRepository: IOverhaulRepository) {}

  public async createNecesidad(
    input: CreateNecesidadInput,
  ): Promise<{ id: string }> {
    const overhaul = await this.overhaulRepository.createFromNecesidad(input)
    return { id: overhaul.id }
  }

  public async updateNecesidad(
    id: string,
    input: CreateNecesidadInput,
  ): Promise<{ id: string }> {
    const overhaul = await this.getOverhaul(id)
    const now = new Date().toISOString()

    overhaul.updateNecesidad(input, now)
    await this.overhaulRepository.save(overhaul)

    return { id: overhaul.id }
  }

  public async updateAlcance(
    id: string,
    input: UpdateAlcanceInput,
  ): Promise<{ id: string }> {
    const overhaul = await this.overhaulRepository.findById(id)
    if (!overhaul) {
      throw new NotFoundError("Overhaul no encontrado")
    }

    const now = new Date().toISOString()
    overhaul.updateAlcance(input, now)
    overhaul.markStageCompleted("alcance", now)
    await this.overhaulRepository.save(overhaul)
    return { id: overhaul.id }
  }

  public async updatePropuesta(
    id: string,
    input: UpdatePropuestaInput,
  ): Promise<{ id: string }> {
    const overhaul = await this.getOverhaul(id)
    const now = new Date().toISOString()

    overhaul.updatePropuesta(input, now)
    overhaul.markStageCompleted("propuesta", now)
    await this.overhaulRepository.save(overhaul)

    return { id: overhaul.id }
  }

  public async updateTarifas(id: string, input: UpdateTarifasInput) {
    const overhaul = await this.getOverhaul(id)

    const now = new Date().toISOString()
    overhaul.updateTarifas(input, now)
    overhaul.markStageCompleted("tarifas", now)
    await this.overhaulRepository.saveTarifas(overhaul)

    return { id: overhaul.id, tarifas: overhaul.stages.tarifas }
  }

  public async updateTarifaRepuestos(
    id: string,
    input: UpdateTarifaRepuestosInput,
  ) {
    const overhaul = await this.getOverhaul(id)

    const now = new Date().toISOString()
    overhaul.updateTarifaRepuestos(input, now)
    overhaul.markStageCompleted("tarifas", now)
    await this.overhaulRepository.saveTarifaRepuestos(overhaul)

    return { id: overhaul.id, tarifas: overhaul.stages.tarifas }
  }

  public async getStageData(id: string, stage: OverhaulStage): Promise<unknown> {
    const overhaul = await this.getOverhaul(id)

    return overhaul.getStage(stage)
  }

  private async getOverhaul(id: string) {
    const overhaul = await this.overhaulRepository.findById(id)
    if (!overhaul) {
      throw new NotFoundError("Overhaul no encontrado")
    }

    return overhaul
  }
}
