import { Currency, Prisma, type PrismaClient } from "@prisma/client"

import { OverhaulEntity } from "@workspace/backend/entities/overhaul"
import type { IOverhaulRepository } from "@workspace/backend/interfaces/repositories"
import type {
  AlcanceSystem,
  CreateNecesidadInput,
  DomainArea,
  MachineRequirement,
  MonitorItem,
  OverhaulStage,
  OverhaulState,
  PropuestaContact,
  PropuestaInclusionExclusion,
} from "@workspace/backend/types/overhaul"

const monitorStageByArea: Record<DomainArea, OverhaulStage> = {
  comercial: "necesidad",
  tarifas: "tarifas",
  planificacion: "planificacion",
}

const overhaulWithStages = {
  necesidad: { orderBy: [{ version: "desc" }, { updatedAt: "desc" }], take: 1 },
  alcance: { orderBy: [{ version: "desc" }, { updatedAt: "desc" }], take: 1 },
  tarifas: {
    orderBy: [{ version: "desc" }, { updatedAt: "desc" }],
    take: 1,
    include: {
      groups: {
        include: { jobs: { orderBy: { position: "asc" } } },
        orderBy: { position: "asc" },
      },
      partes: { orderBy: { position: "asc" } },
    },
  },
  propuesta: { orderBy: [{ version: "desc" }, { updatedAt: "desc" }], take: 1 },
  planificacion: { orderBy: [{ version: "desc" }, { updatedAt: "desc" }], take: 1 },
} satisfies Prisma.OverhaulInclude

type PersistedOverhaul = Prisma.OverhaulGetPayload<{
  include: typeof overhaulWithStages
}>

export class PrismaOverhaulRepository implements IOverhaulRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async createFromNecesidad(
    input: CreateNecesidadInput,
  ): Promise<OverhaulEntity> {
    const overhaul = await this.prisma.overhaul.create({
      data: {
        necesidad: {
          create: {
            proyecto: input.proyecto,
            cliente: input.cliente,
            ubicacion: input.ubicacion,
            tallerDestino: input.tallerDestino,
            fechaEstimada: new Date(input.fechaEstimada),
            fechaTarifa: new Date(input.fechaTarifa),
            maquinas: input.maquinas,
          },
        },
        alcance: { create: { resumen: "", systems: [] } },
        tarifas: { create: { currency: Currency.USD, total: 0 } },
        propuesta: { create: {} },
        planificacion: { create: {} },
      },
      include: overhaulWithStages,
    })

    return this.mapToEntity(overhaul)
  }

  public async findById(id: string): Promise<OverhaulEntity | undefined> {
    const overhaul = await this.prisma.overhaul.findUnique({
      where: { id },
      include: overhaulWithStages,
    })

    if (!overhaul) {
      return undefined
    }

    if (!this.hasAllStages(overhaul)) {
      throw new Error("Overhaul incompleto: faltan etapas relacionadas")
    }

    return this.mapToEntity(overhaul)
  }

  public async save(overhaul: OverhaulEntity): Promise<void> {
    await this.prisma.overhaul.update({
      where: { id: overhaul.id },
      data: {
        state: overhaul.state,
        updatedAt: new Date(overhaul.updatedAt),
        necesidad: { create: this.necesidadSnapshot(overhaul) },
        alcance: { create: this.alcanceSnapshot(overhaul) },
        tarifas: { create: this.tarifasSnapshot(overhaul) },
        propuesta: { create: this.propuestaSnapshot(overhaul) },
        planificacion: { create: this.planificacionSnapshot(overhaul) },
      },
    })
  }

  public async saveTarifas(overhaul: OverhaulEntity): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.overhaulTarifas.create({
        data: { overhaulId: overhaul.id, ...this.tarifasSnapshot(overhaul) },
      })

      await this.saveTarifasCascade(transaction, overhaul)
    })
  }

  public async saveTarifaRepuestos(overhaul: OverhaulEntity): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.overhaulTarifas.create({
        data: { overhaulId: overhaul.id, ...this.tarifasSnapshot(overhaul) },
      })

      await this.saveTarifasCascade(transaction, overhaul)
    })
  }

  public async listMonitor(area: DomainArea): Promise<MonitorItem[]> {
    const stageKey = monitorStageByArea[area]

    const overhauls = await this.prisma.overhaul.findMany({
      include: overhaulWithStages,
      orderBy: { updatedAt: "desc" },
    })

    return overhauls.flatMap((overhaul) => {
      if (!this.hasAllStages(overhaul)) {
        return []
      }

      const [necesidad] = overhaul.necesidad
      const [alcance] = overhaul.alcance
      const [tarifas] = overhaul.tarifas
      const [propuesta] = overhaul.propuesta
      const [planificacion] = overhaul.planificacion

      if (!necesidad || !alcance || !tarifas || !propuesta || !planificacion) {
        return []
      }

      const stageData = {
        necesidad,
        alcance,
        tarifas,
        propuesta,
        planificacion,
      }[stageKey]

      return [
          {
            overhaulId: overhaul.id,
            proyecto: necesidad.proyecto,
            cliente: necesidad.cliente,
            ubicacion: necesidad.ubicacion,
            tallerDestino: necesidad.tallerDestino,
            estado: overhaul.state as OverhaulState,
            fechaEstimada: necesidad.fechaEstimada.toISOString(),
            fechaTarifa: necesidad.fechaTarifa.toISOString(),
            stage: stageKey,
            version: stageData.version,
            isCompleted: stageData.isCompleted,
            updatedAt: stageData.updatedAt.toISOString(),
            createdAt: overhaul.createdAt.toISOString(),
          },
        ]
    })
  }

  private mapToEntity(overhaul: PersistedOverhaul): OverhaulEntity {
    if (!this.hasAllStages(overhaul)) {
      throw new Error("Overhaul incompleto: faltan etapas relacionadas")
    }

    const [necesidad] = overhaul.necesidad
    const [alcance] = overhaul.alcance
    const [tarifas] = overhaul.tarifas
    const [propuesta] = overhaul.propuesta
    const [planificacion] = overhaul.planificacion

    if (!necesidad || !alcance || !tarifas || !propuesta || !planificacion) {
      throw new Error("Overhaul incompleto: faltan etapas relacionadas")
    }

    return new OverhaulEntity(
      overhaul.id,
      overhaul.state,
      overhaul.createdAt.toISOString(),
      overhaul.updatedAt.toISOString(),
      {
        necesidad: {
          proyecto: necesidad.proyecto,
          cliente: necesidad.cliente,
          ubicacion: necesidad.ubicacion,
          tallerDestino: necesidad.tallerDestino,
          fechaEstimada: necesidad.fechaEstimada.toISOString(),
          fechaTarifa: necesidad.fechaTarifa.toISOString(),
          maquinas: necesidad.maquinas as MachineRequirement[],
          version: necesidad.version,
          isCompleted: necesidad.isCompleted,
          completedAt: necesidad.completedAt
            ? necesidad.completedAt.toISOString()
            : null,
          createdAt: necesidad.createdAt.toISOString(),
          updatedAt: necesidad.updatedAt.toISOString(),
        },
        alcance: {
          resumen: alcance.resumen,
          systems: alcance.systems as AlcanceSystem[],
          version: alcance.version,
          isCompleted: alcance.isCompleted,
          completedAt: alcance.completedAt
            ? alcance.completedAt.toISOString()
            : null,
          updatedAt: alcance.updatedAt.toISOString(),
        },
        tarifas: {
          currency: tarifas.currency,
          total: tarifas.total.toNumber(),
          groups: tarifas.groups.map((group) => ({
            id: group.id,
            name: group.name,
            horas: group.horas.toNumber(),
            position: group.position,
            jobs: group.jobs.map((job) => ({
              id: job.id,
              name: job.name,
              materialAndMo: job.materialAndMo.toNumber(),
              miscelaneos: job.miscelaneos.toNumber(),
              repuestos: job.repuestos.toNumber(),
              position: job.position,
            })),
          })),
          partes: tarifas.partes.map((parte) => ({
            id: parte.id,
            segmentacion: parte.segmentacion,
            componentCode: parte.componentCode,
            jobCode: parte.jobCode,
            parentPartName: parte.parentPartName,
            groupNumber: parte.groupNumber,
            partNumber: parte.partNumber,
            partNumberSap: parte.partNumberSap,
            partName: parte.partName,
            quantity: parte.quantity.toNumber(),
            replacementPercent: parte.replacementPercent.toNumber(),
            dealerNet: parte.dealerNet.toNumber(),
            costoInterno: parte.costoInterno.toNumber(),
            pu: parte.pu.toNumber(),
            subtotal: parte.subtotal.toNumber(),
            clasificacion: parte.clasificacion,
            notas: parte.notas ?? undefined,
            motivo: parte.motivo ?? undefined,
            position: parte.position,
          })),
          version: tarifas.version,
          isCompleted: tarifas.isCompleted,
          completedAt: tarifas.completedAt
            ? tarifas.completedAt.toISOString()
            : null,
          updatedAt: tarifas.updatedAt.toISOString(),
        },
        propuesta: {
          emision: propuesta.emision
            ? propuesta.emision.toISOString()
            : "",
          contacto: propuesta.contacto as PropuestaContact,
          condiciones: propuesta.condiciones,
          inclusionesExclusiones:
            propuesta.inclusionesExclusiones as PropuestaInclusionExclusion[],
          fechaReparacion: propuesta.fechaReparacion
            ? propuesta.fechaReparacion.toISOString()
            : "",
          terminosGenerales: propuesta.terminosGenerales,
          garantias: propuesta.garantias,
          propuestaUri: propuesta.propuestaUri,
          version: propuesta.version,
          isCompleted: propuesta.isCompleted,
          completedAt: propuesta.completedAt
            ? propuesta.completedAt.toISOString()
            : null,
          updatedAt: propuesta.updatedAt.toISOString(),
        },
        planificacion: {
          fechaInicio: planificacion.fechaInicio
            ? planificacion.fechaInicio.toISOString()
            : "",
          fechaFin: planificacion.fechaFin
            ? planificacion.fechaFin.toISOString()
            : "",
          version: planificacion.version,
          isCompleted: planificacion.isCompleted,
          completedAt: planificacion.completedAt
            ? planificacion.completedAt.toISOString()
            : null,
          updatedAt: planificacion.updatedAt.toISOString(),
        },
      },
    )
  }

  private async saveTarifasCascade(
    transaction: Prisma.TransactionClient,
    overhaul: OverhaulEntity,
  ): Promise<void> {
    await transaction.overhaul.update({
      where: { id: overhaul.id },
      data: { updatedAt: new Date(overhaul.updatedAt) },
    })
    await transaction.overhaulPropuesta.create({
      data: { overhaulId: overhaul.id, ...this.propuestaSnapshot(overhaul) },
    })
    await transaction.overhaulPlanificacion.create({
      data: { overhaulId: overhaul.id, ...this.planificacionSnapshot(overhaul) },
    })
  }

  private hasAllStages(overhaul: PersistedOverhaul): boolean {
    return (
      overhaul.necesidad.length > 0 &&
      overhaul.alcance.length > 0 &&
      overhaul.tarifas.length > 0 &&
      overhaul.propuesta.length > 0 &&
      overhaul.planificacion.length > 0
    )
  }

  private necesidadSnapshot(overhaul: OverhaulEntity) {
    const necesidad = overhaul.stages.necesidad
    return {
      proyecto: necesidad.proyecto,
      cliente: necesidad.cliente,
      ubicacion: necesidad.ubicacion,
      tallerDestino: necesidad.tallerDestino,
      fechaEstimada: new Date(necesidad.fechaEstimada),
      fechaTarifa: new Date(necesidad.fechaTarifa),
      maquinas: necesidad.maquinas,
      version: necesidad.version,
      isCompleted: necesidad.isCompleted,
      completedAt: necesidad.completedAt ? new Date(necesidad.completedAt) : null,
      updatedAt: new Date(necesidad.updatedAt),
    }
  }

  private alcanceSnapshot(overhaul: OverhaulEntity) {
    const alcance = overhaul.stages.alcance
    return {
      resumen: alcance.resumen,
      systems: alcance.systems,
      version: alcance.version,
      isCompleted: alcance.isCompleted,
      completedAt: alcance.completedAt ? new Date(alcance.completedAt) : null,
      updatedAt: new Date(alcance.updatedAt),
    }
  }

  private tarifasSnapshot(overhaul: OverhaulEntity) {
    const tarifas = overhaul.stages.tarifas
    return {
      currency: tarifas.currency === "PEN" ? Currency.PEN : Currency.USD,
      total: tarifas.total,
      version: tarifas.version,
      isCompleted: tarifas.isCompleted,
      completedAt: tarifas.completedAt ? new Date(tarifas.completedAt) : null,
      updatedAt: new Date(tarifas.updatedAt),
      groups: {
        create: tarifas.groups.map((group) => ({
          name: group.name,
          horas: group.horas,
          position: group.position,
          jobs: {
            create: group.jobs.map((job) => ({
              name: job.name,
              materialAndMo: job.materialAndMo,
              miscelaneos: job.miscelaneos,
              repuestos: job.repuestos,
              position: job.position,
            })),
          },
        })),
      },
      partes: {
        create: tarifas.partes.map((parte) => ({
          segmentacion: parte.segmentacion,
          componentCode: parte.componentCode,
          jobCode: parte.jobCode,
          parentPartName: parte.parentPartName,
          groupNumber: parte.groupNumber,
          partNumber: parte.partNumber,
          partNumberSap: parte.partNumberSap,
          partName: parte.partName,
          quantity: parte.quantity,
          replacementPercent: parte.replacementPercent,
          dealerNet: parte.dealerNet,
          costoInterno: parte.costoInterno,
          pu: parte.pu,
          subtotal: parte.subtotal,
          clasificacion: parte.clasificacion,
          notas: parte.notas || null,
          motivo: parte.motivo || null,
          position: parte.position,
        })),
      },
    }
  }

  private propuestaSnapshot(overhaul: OverhaulEntity) {
    const propuesta = overhaul.stages.propuesta
    return {
      emision: propuesta.emision ? new Date(propuesta.emision) : null,
      contacto: propuesta.contacto,
      condiciones: propuesta.condiciones,
      inclusionesExclusiones: propuesta.inclusionesExclusiones,
      fechaReparacion: propuesta.fechaReparacion
        ? new Date(propuesta.fechaReparacion)
        : null,
      terminosGenerales: propuesta.terminosGenerales,
      garantias: propuesta.garantias,
      propuestaUri: propuesta.propuestaUri,
      version: propuesta.version,
      isCompleted: propuesta.isCompleted,
      completedAt: propuesta.completedAt ? new Date(propuesta.completedAt) : null,
      updatedAt: new Date(propuesta.updatedAt),
    }
  }

  private planificacionSnapshot(overhaul: OverhaulEntity) {
    const planificacion = overhaul.stages.planificacion
    return {
      fechaInicio: planificacion.fechaInicio
        ? new Date(planificacion.fechaInicio)
        : null,
      fechaFin: planificacion.fechaFin ? new Date(planificacion.fechaFin) : null,
      version: planificacion.version,
      isCompleted: planificacion.isCompleted,
      completedAt: planificacion.completedAt
        ? new Date(planificacion.completedAt)
        : null,
      updatedAt: new Date(planificacion.updatedAt),
    }
  }
}
