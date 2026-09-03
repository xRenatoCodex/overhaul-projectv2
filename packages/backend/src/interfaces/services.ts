import type { LoginRequest, LoginResponse } from "@workspace/backend/types/auth"
import type {
  CreateNecesidadInput,
  DomainArea,
  MonitorItem,
  OverhaulHistory,
  OverhaulSummary,
  OverhaulTarifasData,
  OverhaulStage,
  UpdateAlcanceInput,
  UpdatePropuestaInput,
  UpdateTarifaRepuestosInput,
  UpdateTarifasInput,
} from "@workspace/backend/types/overhaul"

export interface IAuthService {
  login(input: LoginRequest): Promise<LoginResponse>
}

export interface IOverhaulService {
  createNecesidad(
    input: CreateNecesidadInput,
    actor?: string | null,
  ): Promise<{ id: string }>
  updateNecesidad(
    id: string,
    input: CreateNecesidadInput,
    actor?: string | null,
  ): Promise<{ id: string }>
  updateAlcance(
    id: string,
    input: UpdateAlcanceInput,
    actor?: string | null,
  ): Promise<{ id: string }>
  updatePropuesta(
    id: string,
    input: UpdatePropuestaInput,
    actor?: string | null,
  ): Promise<{ id: string }>
  updateTarifas(
    id: string,
    input: UpdateTarifasInput,
    actor?: string | null,
  ): Promise<{ id: string; tarifas: OverhaulTarifasData }>
  updateTarifaRepuestos(
    id: string,
    input: UpdateTarifaRepuestosInput,
    actor?: string | null,
  ): Promise<{ id: string; tarifas: OverhaulTarifasData }>
  getStageData(id: string, stage: OverhaulStage): Promise<unknown>
  getSummary(id: string): Promise<OverhaulSummary>
  getHistory(id: string): Promise<OverhaulHistory>
}

export interface IDashboardService {
  getMonitor(area: DomainArea): Promise<MonitorItem[]>
}
