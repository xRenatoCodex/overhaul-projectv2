import type { OverhaulEntity } from "@workspace/backend/entities/overhaul"
import type { UserEntity } from "@workspace/backend/entities/user"
import type {
  CreateNecesidadInput,
  DomainArea,
  MonitorItem,
  OverhaulHistory,
} from "@workspace/backend/types/overhaul"

export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | undefined>
}

export interface IOverhaulRepository {
  createFromNecesidad(
    input: CreateNecesidadInput,
    actor?: string | null,
  ): Promise<OverhaulEntity>
  findById(id: string): Promise<OverhaulEntity | undefined>
  save(overhaul: OverhaulEntity): Promise<void>
  saveTarifas(overhaul: OverhaulEntity): Promise<void>
  saveTarifaRepuestos(overhaul: OverhaulEntity): Promise<void>
  listMonitor(area: DomainArea): Promise<MonitorItem[]>
  findHistory(overhaulId: string): Promise<OverhaulHistory | undefined>
}
