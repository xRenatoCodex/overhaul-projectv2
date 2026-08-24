import type { LoginRequest, LoginResponse } from "@workspace/backend/types/auth"
import type {
  CreateNecesidadInput,
  DomainArea,
  MonitorItem,
  OverhaulTarifasData,
  OverhaulStage,
  UpdateAlcanceInput,
  UpdateTarifaRepuestosInput,
  UpdateTarifasInput,
} from "@workspace/backend/types/overhaul"

export interface IAuthService {
  login(input: LoginRequest): Promise<LoginResponse>
}

export interface IOverhaulService {
  createNecesidad(input: CreateNecesidadInput): Promise<{ id: string }>
  updateAlcance(id: string, input: UpdateAlcanceInput): Promise<{ id: string }>
  updateTarifas(
    id: string,
    input: UpdateTarifasInput,
  ): Promise<{ id: string; tarifas: OverhaulTarifasData }>
  updateTarifaRepuestos(
    id: string,
    input: UpdateTarifaRepuestosInput,
  ): Promise<{ id: string; tarifas: OverhaulTarifasData }>
  getStageData(id: string, stage: OverhaulStage): Promise<unknown>
}

export interface IDashboardService {
  getMonitor(area: DomainArea): Promise<MonitorItem[]>
}
