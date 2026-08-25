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
} from "@workspace/backend/types/overhaul"

const monitorStageByArea: Record<DomainArea, OverhaulStage> = {
  comercial: "necesidad",
  tarifas: "tarifas",
  planificacion: "planificacion",
}

const overhaulWithStages = {
  necesidad: true,
  alcance: true,
  tarifas: {
    include: {
      groups: {
        include: { jobs: { orderBy: { position: "asc" } } },
        orderBy: { position: "asc" },
      },
      partes: { orderBy: { position: "asc" } },
    },
  },
  propuesta: true,
  planificacion: true,
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
        propuesta: { create: { documento: "" } },
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

    if (
      !overhaul.necesidad ||
      !overhaul.alcance ||
      !overhaul.tarifas ||
      !overhaul.propuesta ||
      !overhaul.planificacion
    ) {
      throw new Error("Overhaul incompleto: faltan etapas relacionadas")
    }

    return this.mapToEntity(overhaul)
  }

  public async save(overhaul: OverhaulEntity): Promise<void> {
    await this.prisma.overhaul.update({
      where: { id: overhaul.id },
      data: {
        state: overhaul.state,
        necesidad: {
          update: {
            proyecto: overhaul.stages.necesidad.proyecto,
            cliente: overhaul.stages.necesidad.cliente,
            ubicacion: overhaul.stages.necesidad.ubicacion,
            tallerDestino: overhaul.stages.necesidad.tallerDestino,
            fechaEstimada: new Date(overhaul.stages.necesidad.fechaEstimada),
            fechaTarifa: new Date(overhaul.stages.necesidad.fechaTarifa),
            maquinas: overhaul.stages.necesidad.maquinas,
            version: overhaul.stages.necesidad.version,
            isCompleted: overhaul.stages.necesidad.isCompleted,
            updatedAt: new Date(overhaul.stages.necesidad.updatedAt),
          },
        },
        alcance: {
          update: {
            resumen: overhaul.stages.alcance.resumen,
            systems: overhaul.stages.alcance.systems,
            version: overhaul.stages.alcance.version,
            isCompleted: overhaul.stages.alcance.isCompleted,
            updatedAt: new Date(overhaul.stages.alcance.updatedAt),
          },
        },
        tarifas: {
          update: {
            currency:
              overhaul.stages.tarifas.currency === "PEN"
                ? Currency.PEN
                : Currency.USD,
            total: overhaul.stages.tarifas.total,
            version: overhaul.stages.tarifas.version,
            isCompleted: overhaul.stages.tarifas.isCompleted,
            updatedAt: new Date(overhaul.stages.tarifas.updatedAt),
          },
        },
        propuesta: {
          update: {
            documento: overhaul.stages.propuesta.documento,
            version: overhaul.stages.propuesta.version,
            isCompleted: overhaul.stages.propuesta.isCompleted,
            updatedAt: new Date(overhaul.stages.propuesta.updatedAt),
          },
        },
        planificacion: {
          update: {
            fechaInicio: overhaul.stages.planificacion.fechaInicio
              ? new Date(overhaul.stages.planificacion.fechaInicio)
              : null,
            fechaFin: overhaul.stages.planificacion.fechaFin
              ? new Date(overhaul.stages.planificacion.fechaFin)
              : null,
            version: overhaul.stages.planificacion.version,
            isCompleted: overhaul.stages.planificacion.isCompleted,
            updatedAt: new Date(overhaul.stages.planificacion.updatedAt),
          },
        },
      },
    })
  }

  public async saveTarifas(overhaul: OverhaulEntity): Promise<void> {
    const tarifas = overhaul.stages.tarifas

    await this.prisma.$transaction(async (transaction) => {
      const persistedTarifa = await transaction.overhaulTarifas.update({
        where: { overhaulId: overhaul.id },
        data: {
          currency: tarifas.currency === "PEN" ? Currency.PEN : Currency.USD,
          total: tarifas.total,
          version: tarifas.version,
          isCompleted: tarifas.isCompleted,
          updatedAt: new Date(tarifas.updatedAt),
        },
      })

      await transaction.overhaulTarifaGroupJob.deleteMany({
        where: { tarifaId: persistedTarifa.id },
      })

      for (const group of tarifas.groups) {
        await transaction.overhaulTarifaGroupJob.create({
          data: {
            ...(group.id ? { id: group.id } : {}),
            tarifaId: persistedTarifa.id,
            name: group.name,
            horas: group.horas,
            position: group.position,
            jobs: {
              create: group.jobs.map((job) => ({
                ...(job.id ? { id: job.id } : {}),
                name: job.name,
                materialAndMo: job.materialAndMo,
                miscelaneos: job.miscelaneos,
                repuestos: job.repuestos,
                position: job.position,
              })),
            },
          },
        })
      }

      await this.saveTarifasCascade(transaction, overhaul)
    })
  }

  public async saveTarifaRepuestos(overhaul: OverhaulEntity): Promise<void> {
    const tarifas = overhaul.stages.tarifas

    await this.prisma.$transaction(async (transaction) => {
      const persistedTarifa = await transaction.overhaulTarifas.update({
        where: { overhaulId: overhaul.id },
        data: {
          version: tarifas.version,
          isCompleted: tarifas.isCompleted,
          updatedAt: new Date(tarifas.updatedAt),
        },
      })

      await transaction.overhaulTarifaParte.deleteMany({
        where: { tarifaId: persistedTarifa.id },
      })

      if (tarifas.partes.length > 0) {
        await transaction.overhaulTarifaParte.createMany({
          data: tarifas.partes.map((parte) => ({
            ...(parte.id ? { id: parte.id } : {}),
            tarifaId: persistedTarifa.id,
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
        })
      }

      await this.saveTarifasCascade(transaction, overhaul)
    })
  }

  public async listMonitor(area: DomainArea): Promise<MonitorItem[]> {
    const stageKey = monitorStageByArea[area]

    const overhauls = await this.prisma.overhaul.findMany({
      include: {
        necesidad: true,
        alcance: true,
        tarifas: true,
        propuesta: true,
        planificacion: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    return overhauls.flatMap((overhaul) => {
      if (
        !overhaul.necesidad ||
        !overhaul.alcance ||
        !overhaul.tarifas ||
        !overhaul.propuesta ||
        !overhaul.planificacion
      ) {
        return []
      }

      const stageData = {
        necesidad: overhaul.necesidad,
        alcance: overhaul.alcance,
        tarifas: overhaul.tarifas,
        propuesta: overhaul.propuesta,
        planificacion: overhaul.planificacion,
      }[stageKey]

      return [
          {
            overhaulId: overhaul.id,
            proyecto: overhaul.necesidad.proyecto,
            cliente: overhaul.necesidad.cliente,
            ubicacion: overhaul.necesidad.ubicacion,
            tallerDestino: overhaul.necesidad.tallerDestino,
            estado: overhaul.state as OverhaulState,
            fechaEstimada: overhaul.necesidad.fechaEstimada.toISOString(),
            fechaTarifa: overhaul.necesidad.fechaTarifa.toISOString(),
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
    if (
      !overhaul.necesidad ||
      !overhaul.alcance ||
      !overhaul.tarifas ||
      !overhaul.propuesta ||
      !overhaul.planificacion
    ) {
      throw new Error("Overhaul incompleto: faltan etapas relacionadas")
    }

    return new OverhaulEntity(
      overhaul.id,
      overhaul.state,
      overhaul.createdAt.toISOString(),
      overhaul.updatedAt.toISOString(),
      {
        necesidad: {
          proyecto: overhaul.necesidad.proyecto,
          cliente: overhaul.necesidad.cliente,
          ubicacion: overhaul.necesidad.ubicacion,
          tallerDestino: overhaul.necesidad.tallerDestino,
          fechaEstimada: overhaul.necesidad.fechaEstimada.toISOString(),
          fechaTarifa: overhaul.necesidad.fechaTarifa.toISOString(),
          maquinas: overhaul.necesidad.maquinas as MachineRequirement[],
          version: overhaul.necesidad.version,
          isCompleted: overhaul.necesidad.isCompleted,
          createdAt: overhaul.necesidad.createdAt.toISOString(),
          updatedAt: overhaul.necesidad.updatedAt.toISOString(),
        },
        alcance: {
          resumen: overhaul.alcance.resumen,
          systems: overhaul.alcance.systems as AlcanceSystem[],
          version: overhaul.alcance.version,
          isCompleted: overhaul.alcance.isCompleted,
          updatedAt: overhaul.alcance.updatedAt.toISOString(),
        },
        tarifas: {
          currency: overhaul.tarifas.currency,
          total: overhaul.tarifas.total.toNumber(),
          groups: overhaul.tarifas.groups.map((group) => ({
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
          partes: overhaul.tarifas.partes.map((parte) => ({
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
          version: overhaul.tarifas.version,
          isCompleted: overhaul.tarifas.isCompleted,
          updatedAt: overhaul.tarifas.updatedAt.toISOString(),
        },
        propuesta: {
          documento: overhaul.propuesta.documento,
          version: overhaul.propuesta.version,
          isCompleted: overhaul.propuesta.isCompleted,
          updatedAt: overhaul.propuesta.updatedAt.toISOString(),
        },
        planificacion: {
          fechaInicio: overhaul.planificacion.fechaInicio
            ? overhaul.planificacion.fechaInicio.toISOString()
            : "",
          fechaFin: overhaul.planificacion.fechaFin
            ? overhaul.planificacion.fechaFin.toISOString()
            : "",
          version: overhaul.planificacion.version,
          isCompleted: overhaul.planificacion.isCompleted,
          updatedAt: overhaul.planificacion.updatedAt.toISOString(),
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
    await transaction.overhaulPropuesta.update({
      where: { overhaulId: overhaul.id },
      data: {
        isCompleted: overhaul.stages.propuesta.isCompleted,
        updatedAt: new Date(overhaul.stages.propuesta.updatedAt),
      },
    })
    await transaction.overhaulPlanificacion.update({
      where: { overhaulId: overhaul.id },
      data: {
        isCompleted: overhaul.stages.planificacion.isCompleted,
        updatedAt: new Date(overhaul.stages.planificacion.updatedAt),
      },
    })
  }
}
