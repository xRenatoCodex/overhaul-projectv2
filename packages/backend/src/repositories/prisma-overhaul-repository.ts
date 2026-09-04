import { Currency, Prisma, type PrismaClient } from "@prisma/client"

import { OverhaulEntity } from "@workspace/backend/entities/overhaul"
import type { IOverhaulRepository } from "@workspace/backend/interfaces/repositories"
import type { AuthUser } from "@workspace/backend/types/auth"
import type {
  AlcanceSystem,
  CreateNecesidadInput,
  DomainArea,
  MachineRequirement,
  MonitorItem,
  OverhaulHistory,
  OverhaulHistoryEntry,
  OverhaulStage,
  OverhaulState,
  PropuestaInclusionExclusion,
} from "@workspace/backend/types/overhaul"

const monitorStageByArea: Record<DomainArea, OverhaulStage> = {
  comercial: "necesidad",
  tarifas: "tarifas",
  planificacion: "planificacion",
}

const overhaulWithStages = {
  necesidad: {
    orderBy: [{ version: "desc" }, { updatedAt: "desc" }],
    take: 1,
    include: {
      cliente: true,
      tallerDestino: true,
      maquinas: { include: { maquina: { include: { modelo: true } } } },
      createdBy: { select: { name: true } },
    },
  },
  alcance: {
    orderBy: [{ version: "desc" }, { updatedAt: "desc" }],
    take: 1,
    include: {
      systems: {
        orderBy: { position: "asc" },
        include: {
          components: {
            orderBy: { position: "asc" },
            include: { taller: true, atencion: true },
          },
        },
      },
      createdBy: { select: { name: true } },
    },
  },
  tarifas: {
    orderBy: [{ version: "desc" }, { updatedAt: "desc" }],
    take: 1,
    include: {
      groups: {
        include: { jobs: { orderBy: { position: "asc" } } },
        orderBy: { position: "asc" },
      },
      partes: { orderBy: { position: "asc" } },
      createdBy: { select: { name: true } },
    },
  },
  propuesta: {
    orderBy: [{ version: "desc" }, { updatedAt: "desc" }],
    take: 1,
    include: {
      inclusionesExclusiones: { orderBy: { position: "asc" } },
      createdBy: { select: { name: true } },
    },
  },
  planificacion: {
    orderBy: [{ version: "desc" }, { updatedAt: "desc" }],
    take: 1,
    include: { createdBy: { select: { name: true } } },
  },
} satisfies Prisma.OverhaulInclude

type PersistedOverhaul = Prisma.OverhaulGetPayload<{
  include: typeof overhaulWithStages
}>

export class PrismaOverhaulRepository implements IOverhaulRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async createFromNecesidad(
    input: CreateNecesidadInput,
    actor: AuthUser | null = null,
  ): Promise<OverhaulEntity> {
    const clienteId = await this.resolveClienteId(input.cliente)
    const tallerDestinoId = await this.resolveTallerId(input.tallerDestino)
    const maquinasCreate = await this.buildMaquinasCreate(input.maquinas, clienteId)

    let validActorId: string | null = null
    if (actor) {
      const user = await this.prisma.user.upsert({
        where: { email: actor.email },
        update: {},
        create: {
          id: actor.id,
          email: actor.email,
          name: actor.name,
          passwordHash: "session-user",
          role: "commercial",
        },
      })
      validActorId = user.id
    }

    const necesidadData: any = {
      proyecto: input.proyecto,
      clienteId,
      ubicacion: input.ubicacion,
      tallerDestinoId,
      fechaEstimada: new Date(input.fechaEstimada),
      fechaTarifa: new Date(input.fechaTarifa),
      maquinas: { create: maquinasCreate },
      isCompleted: true,
    }
    if (validActorId) necesidadData.createdById = validActorId

    const overhaul = await this.prisma.overhaul.create({
      data: {
        necesidad: { create: necesidadData },
        alcance: { create: validActorId ? { resumen: "", createdById: validActorId } : { resumen: "" } },
        tarifas: {
          create: validActorId
            ? { currency: Currency.USD, total: 0, createdById: validActorId }
            : { currency: Currency.USD, total: 0 },
        },
        propuesta: { create: validActorId ? { createdById: validActorId } : {} },
        planificacion: { create: validActorId ? { createdById: validActorId } : {} },
      },
      include: overhaulWithStages,
    })

    return this.mapToEntity(overhaul)
  }

  // Registers (or reuses) the free-text cliente/taller/modelo entries from the datalist-backed forms.
  private async resolveClienteId(name: string): Promise<string> {
    const trimmed = name.trim()
    const cliente = await this.prisma.masterCliente.upsert({
      where: { name: trimmed },
      update: {},
      create: { name: trimmed },
    })
    return cliente.id
  }

  private async resolveTallerId(name: string): Promise<string> {
    const trimmed = name.trim()
    const taller = await this.prisma.masterTaller.upsert({
      where: { name: trimmed },
      update: {},
      create: { name: trimmed, location: trimmed },
    })
    return taller.id
  }

  private async validateActor(actor: string | null): Promise<string | null> {
    if (!actor) return null
    const userExists = await this.prisma.user.findUnique({ where: { id: actor } })
    return userExists ? actor : null
  }

  private async resolveAtencionId(name: string | undefined): Promise<string | undefined> {
    const trimmed = name?.trim()
    if (!trimmed) {
      return undefined
    }
    const atencion = await this.prisma.masterAtencion.upsert({
      where: { name: trimmed },
      update: {},
      create: { name: trimmed },
    })
    return atencion.id
  }

  private async resolveModeloId(modelo: string): Promise<string> {
    const trimmed = modelo.trim()
    const found = await this.prisma.masterMaquinaModelo.upsert({
      where: { modelo: trimmed },
      update: {},
      create: { modelo: trimmed, type: "Sin clasificar" },
    })
    return found.id
  }

  private async buildMaquinasCreate(
    maquinas: MachineRequirement[],
    clienteId: string,
  ): Promise<Prisma.OverhaulNecesidadMaquinaCreateWithoutNecesidadInput[]> {
    const created: Prisma.OverhaulNecesidadMaquinaCreateWithoutNecesidadInput[] = []

    for (const { model, serial } of maquinas) {
      const modeloId = await this.resolveModeloId(model)
      const serie = serial.trim()
      const maquina = await this.prisma.maquina.upsert({
        where: { modeloId_serie: { modeloId, serie } },
        update: {},
        create: { modeloId, serie, clienteId },
      })
      created.push({ maquina: { connect: { id: maquina.id } } })
    }

    return created
  }

  private async buildAlcanceSystemsCreate(
    systems: AlcanceSystem[],
  ): Promise<Prisma.OverhaulAlcanceSystemCreateWithoutAlcanceInput[]> {
    const systemsCreate: Prisma.OverhaulAlcanceSystemCreateWithoutAlcanceInput[] = []

    for (const [position, system] of systems.entries()) {
      const componentsCreate: Prisma.OverhaulAlcanceComponentCreateWithoutSystemInput[] = []

      for (const [componentPosition, component] of system.components.entries()) {
        const tallerId = component.taller ? await this.resolveTallerId(component.taller) : undefined
        const atencionId = await this.resolveAtencionId(component.atencion)

        componentsCreate.push({
          name: component.name,
          state: component.state,
          taller: tallerId ? { connect: { id: tallerId } } : undefined,
          atencion: atencionId ? { connect: { id: atencionId } } : undefined,
          comentarios: component.comentarios || null,
          position: componentPosition,
        })
      }

      systemsCreate.push({
        name: system.name,
        position,
        components: { create: componentsCreate },
      })
    }

    return systemsCreate
  }

  private buildInclusionesExclusionesCreate(
    items: PropuestaInclusionExclusion[],
  ): Prisma.OverhaulPropuestaInclusionExclusionCreateWithoutPropuestaInput[] {
    return items.map((item, position) => ({
      systemName: item.system,
      components: item.components,
      inclusiones: item.inclusiones,
      exclusiones: item.exclusiones,
      position,
    }))
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
    // Validate actor exists in database before persisting
    if (overhaul.actor) {
      const userExists = await this.prisma.user.findUnique({ where: { id: overhaul.actor } })
      if (!userExists) {
        overhaul.actor = null
      }
    }

    const [necesidadData, alcanceData] = await Promise.all([
      this.necesidadSnapshot(overhaul),
      this.alcanceSnapshot(overhaul),
    ])

    await this.prisma.overhaul.update({
      where: { id: overhaul.id },
      data: {
        state: overhaul.state,
        updatedAt: new Date(overhaul.updatedAt),
        necesidad: { create: necesidadData },
        alcance: { create: alcanceData },
        tarifas: { create: this.tarifasSnapshot(overhaul) },
        propuesta: { create: this.propuestaSnapshot(overhaul) },
        planificacion: { create: this.planificacionSnapshot(overhaul) },
      },
    })
  }

  public async saveTarifas(overhaul: OverhaulEntity): Promise<void> {
    // Validate actor exists in database
    if (overhaul.actor) {
      const userExists = await this.prisma.user.findUnique({ where: { id: overhaul.actor } })
      if (!userExists) {
        overhaul.actor = null
      }
    }
    
    await this.prisma.$transaction(async (transaction) => {
      await transaction.overhaulTarifas.create({
        data: { overhaulId: overhaul.id, ...this.tarifasSnapshot(overhaul) },
      })

      await this.saveTarifasCascade(transaction, overhaul)
    })
  }

  public async saveTarifaRepuestos(overhaul: OverhaulEntity): Promise<void> {
    // Validate actor exists in database
    if (overhaul.actor) {
      const userExists = await this.prisma.user.findUnique({ where: { id: overhaul.actor } })
      if (!userExists) {
        overhaul.actor = null
      }
    }
    
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

      const stages = [
        { stage: "necesidad", data: necesidad },
        { stage: "alcance", data: alcance },
        { stage: "tarifas", data: tarifas },
        { stage: "propuesta", data: propuesta },
        { stage: "planificacion", data: planificacion },
      ].map(({ stage, data }) => ({
        stage: stage as OverhaulStage,
        version: data.version,
        isCompleted: data.isCompleted,
        updatedAt: data.updatedAt.toISOString(),
      }))

      return [
        {
          overhaulId: overhaul.id,
          proyecto: necesidad.proyecto,
          cliente: necesidad.cliente.name,
          ubicacion: necesidad.ubicacion,
          tallerDestino: necesidad.tallerDestino.name,
          estado: overhaul.state as OverhaulState,
          fechaEstimada: necesidad.fechaEstimada.toISOString(),
          fechaTarifa: necesidad.fechaTarifa.toISOString(),
          stage: stageKey,
          version: stageData.version,
          isCompleted: stageData.isCompleted,
          updatedAt: stageData.updatedAt.toISOString(),
          createdAt: overhaul.createdAt.toISOString(),
          stages,
        },
      ]
    })
  }

  public async findHistory(
    overhaulId: string,
  ): Promise<OverhaulHistory | undefined> {
    const historySelect = {
      id: true,
      version: true,
      isCompleted: true,
      createdBy: { select: { name: true } },
      createdAt: true,
      updatedAt: true,
    }
    const historyOrder = [
      { version: Prisma.SortOrder.asc },
      { createdAt: Prisma.SortOrder.asc },
    ]

    const overhaul = await this.prisma.overhaul.findUnique({
      where: { id: overhaulId },
      include: {
        necesidad: {
          select: { ...historySelect, proyecto: true },
          orderBy: historyOrder,
        },
        alcance: { select: historySelect, orderBy: historyOrder },
        tarifas: { select: historySelect, orderBy: historyOrder },
        propuesta: { select: historySelect, orderBy: historyOrder },
        planificacion: { select: historySelect, orderBy: historyOrder },
      },
    })

    if (!overhaul) {
      return undefined
    }

    const toEntries = (
      stage: OverhaulStage,
      rows: {
        id: string
        version: number
        isCompleted: boolean
        createdBy: { name: string } | null
        createdAt: Date
        updatedAt: Date
      }[],
    ): OverhaulHistoryEntry[] =>
      rows.map((row) => ({
        id: row.id,
        stage,
        version: row.version,
        isCompleted: row.isCompleted,
        author: row.createdBy?.name ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }))

    const entries = [
      ...toEntries("necesidad", overhaul.necesidad),
      ...toEntries("alcance", overhaul.alcance),
      ...toEntries("tarifas", overhaul.tarifas),
      ...toEntries("propuesta", overhaul.propuesta),
      ...toEntries("planificacion", overhaul.planificacion),
    ].sort((left, right) => left.createdAt.localeCompare(right.createdAt))

    const latestNecesidad = overhaul.necesidad.at(-1)

    return {
      overhaulId: overhaul.id,
      proyecto: latestNecesidad?.proyecto ?? "Overhaul",
      entries,
    }
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
          cliente: necesidad.cliente.name,
          ubicacion: necesidad.ubicacion,
          tallerDestino: necesidad.tallerDestino.name,
          fechaEstimada: necesidad.fechaEstimada.toISOString(),
          fechaTarifa: necesidad.fechaTarifa.toISOString(),
          maquinas: necesidad.maquinas.map((item) => ({
            model: item.maquina.modelo.modelo,
            serial: item.maquina.serie,
          })),
          version: necesidad.version,
          isCompleted: necesidad.isCompleted,
          completedAt: necesidad.completedAt
            ? necesidad.completedAt.toISOString()
            : null,
          createdAt: necesidad.createdAt.toISOString(),
          updatedAt: necesidad.updatedAt.toISOString(),
          createdById: necesidad.createdById,
          createdBy: necesidad.createdBy?.name ?? null,
        },
        alcance: {
          resumen: alcance.resumen,
          systems: alcance.systems.map((system) => ({
            name: system.name,
            components: system.components.map((component) => ({
              name: component.name,
              state: component.state,
              taller: component.taller?.name,
              atencion: component.atencion?.name,
              comentarios: component.comentarios ?? undefined,
            })),
          })),
          version: alcance.version,
          isCompleted: alcance.isCompleted,
          completedAt: alcance.completedAt
            ? alcance.completedAt.toISOString()
            : null,
          createdAt: alcance.createdAt.toISOString(),
          updatedAt: alcance.updatedAt.toISOString(),
          createdById: alcance.createdById,
          createdBy: alcance.createdBy?.name ?? null,
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
          createdAt: tarifas.createdAt.toISOString(),
          updatedAt: tarifas.updatedAt.toISOString(),
          createdById: tarifas.createdById,
          createdBy: tarifas.createdBy?.name ?? null,
        },
        propuesta: {
          emision: propuesta.emision
            ? propuesta.emision.toISOString()
            : "",
          contacto: {
            name: propuesta.contactoNombre,
            location: propuesta.contactoUbicacion,
            phone: propuesta.contactoTelefono ?? undefined,
            email: propuesta.contactoEmail ?? undefined,
          },
          condiciones: propuesta.condiciones,
          inclusionesExclusiones: propuesta.inclusionesExclusiones.map((item) => ({
            system: item.systemName,
            components: item.components,
            inclusiones: item.inclusiones,
            exclusiones: item.exclusiones,
          })),
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
          createdAt: propuesta.createdAt.toISOString(),
          updatedAt: propuesta.updatedAt.toISOString(),
          createdById: propuesta.createdById,
          createdBy: propuesta.createdBy?.name ?? null,
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
          createdAt: planificacion.createdAt.toISOString(),
          updatedAt: planificacion.updatedAt.toISOString(),
          createdById: planificacion.createdById,
          createdBy: planificacion.createdBy?.name ?? null,
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
      data: { overhaulId: overhaul.id, ...await this.propuestaSnapshot(overhaul) },
    })
    await transaction.overhaulPlanificacion.create({
      data: { overhaulId: overhaul.id, ...await this.planificacionSnapshot(overhaul) },
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

  private async necesidadSnapshot(overhaul: OverhaulEntity) {
    const necesidad = overhaul.stages.necesidad
    const clienteId = await this.resolveClienteId(necesidad.cliente)
    const tallerDestinoId = await this.resolveTallerId(necesidad.tallerDestino)
    const maquinasCreate = await this.buildMaquinasCreate(necesidad.maquinas, clienteId)

    const data: any = {
      proyecto: necesidad.proyecto,
      clienteId,
      ubicacion: necesidad.ubicacion,
      tallerDestinoId,
      fechaEstimada: new Date(necesidad.fechaEstimada),
      fechaTarifa: new Date(necesidad.fechaTarifa),
      maquinas: { create: maquinasCreate },
      version: necesidad.version,
      isCompleted: necesidad.isCompleted,
      completedAt: necesidad.completedAt ? new Date(necesidad.completedAt) : null,
      createdAt: new Date(necesidad.createdAt),
      updatedAt: new Date(necesidad.updatedAt),
    }
    if (overhaul.actor) data.createdById = overhaul.actor
    return data
  }

  private async alcanceSnapshot(overhaul: OverhaulEntity) {
    const alcance = overhaul.stages.alcance
    const systemsCreate = await this.buildAlcanceSystemsCreate(alcance.systems)

    const data: any = {
      resumen: alcance.resumen,
      systems: { create: systemsCreate },
      version: alcance.version,
      isCompleted: alcance.isCompleted,
      completedAt: alcance.completedAt ? new Date(alcance.completedAt) : null,
      createdAt: new Date(alcance.createdAt),
      updatedAt: new Date(alcance.updatedAt),
    }
    if (overhaul.actor) data.createdById = overhaul.actor
    return data
  }

  private tarifasSnapshot(overhaul: OverhaulEntity) {
    const tarifas = overhaul.stages.tarifas
    const data: any = {
      currency: tarifas.currency === "PEN" ? Currency.PEN : Currency.USD,
      total: tarifas.total,
      version: tarifas.version,
      isCompleted: tarifas.isCompleted,
      completedAt: tarifas.completedAt ? new Date(tarifas.completedAt) : null,
      createdAt: new Date(tarifas.createdAt),
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
    if (overhaul.actor) data.createdById = overhaul.actor
    return data
  }

  private propuestaSnapshot(overhaul: OverhaulEntity) {
    const propuesta = overhaul.stages.propuesta
    const data: any = {
      emision: propuesta.emision ? new Date(propuesta.emision) : null,
      contactoNombre: propuesta.contacto.name,
      contactoUbicacion: propuesta.contacto.location,
      contactoTelefono: propuesta.contacto.phone || null,
      contactoEmail: propuesta.contacto.email || null,
      condiciones: propuesta.condiciones,
      inclusionesExclusiones: {
        create: this.buildInclusionesExclusionesCreate(propuesta.inclusionesExclusiones),
      },
      fechaReparacion: propuesta.fechaReparacion
        ? new Date(propuesta.fechaReparacion)
        : null,
      terminosGenerales: propuesta.terminosGenerales,
      garantias: propuesta.garantias,
      propuestaUri: propuesta.propuestaUri,
      version: propuesta.version,
      isCompleted: propuesta.isCompleted,
      completedAt: propuesta.completedAt ? new Date(propuesta.completedAt) : null,
      createdAt: new Date(propuesta.createdAt),
      updatedAt: new Date(propuesta.updatedAt),
    }
    if (overhaul.actor) data.createdById = overhaul.actor
    return data
  }

  private planificacionSnapshot(overhaul: OverhaulEntity) {
    const planificacion = overhaul.stages.planificacion
    const data: any = {
      fechaInicio: planificacion.fechaInicio
        ? new Date(planificacion.fechaInicio)
        : null,
      fechaFin: planificacion.fechaFin ? new Date(planificacion.fechaFin) : null,
      version: planificacion.version,
      isCompleted: planificacion.isCompleted,
      completedAt: planificacion.completedAt
        ? new Date(planificacion.completedAt)
        : null,
      createdAt: new Date(planificacion.createdAt),
      updatedAt: new Date(planificacion.updatedAt),
    }
    if (overhaul.actor) data.createdById = overhaul.actor
    return data
  }
}
