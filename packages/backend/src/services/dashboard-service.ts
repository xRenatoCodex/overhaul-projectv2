import type { IOverhaulRepository } from "@workspace/backend/interfaces/repositories"
import type { IDashboardService } from "@workspace/backend/interfaces/services"
import type { DomainArea, MonitorItem } from "@workspace/backend/types/overhaul"

export class DashboardService implements IDashboardService {
  constructor(private readonly overhaulRepository: IOverhaulRepository) {}

  public async getMonitor(area: DomainArea): Promise<MonitorItem[]> {
    return this.overhaulRepository.listMonitor(area)
  }
}
