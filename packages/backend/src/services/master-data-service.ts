import type { PrismaClient } from "@prisma/client"

import type { AlcanceSystem } from "@workspace/backend/types/overhaul"

export type MasterDataOptions = {
  clientes: string[]
  talleres: string[]
  atenciones: string[]
  modelos: string[]
}

export class MasterDataService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getOptions(): Promise<MasterDataOptions> {
    const [clientes, talleres, atenciones, modelos] = await Promise.all([
      this.prisma.masterCliente.findMany({ orderBy: { name: "asc" } }),
      this.prisma.masterTaller.findMany({ orderBy: { name: "asc" } }),
      this.prisma.masterAtencion.findMany({ orderBy: { name: "asc" } }),
      this.prisma.masterMaquinaModelo.findMany({ orderBy: { modelo: "asc" } }),
    ])

    return {
      clientes: clientes.map(({ name }) => name),
      talleres: talleres.map(({ name }) => name),
      atenciones: atenciones.map(({ name }) => name),
      modelos: modelos.map(({ modelo }) => modelo),
    }
  }

  public async getSystemsByModels(models: string[]): Promise<AlcanceSystem[]> {
    const normalizedModels = [...new Set(models.map((model) => model.trim()))].filter(Boolean)
    if (normalizedModels.length === 0) {
      return []
    }

    const masterModels = await this.prisma.masterMaquinaModelo.findMany({
      where: { modelo: { in: normalizedModels, mode: "insensitive" } },
      include: {
        systems: {
          orderBy: { name: "asc" },
          include: { components: { orderBy: { name: "asc" } } },
        },
      },
    })

    const systems = new Map<string, AlcanceSystem>()
    for (const masterModel of masterModels) {
      for (const masterSystem of masterModel.systems) {
        const existing = systems.get(masterSystem.name)
        const componentNames = new Set(existing?.components.map(({ name }) => name) ?? [])
        const components = existing?.components ?? []

        for (const masterComponent of masterSystem.components) {
          if (!componentNames.has(masterComponent.name)) {
            components.push({
              name: masterComponent.name,
              state: "Nuevo",
              taller: "",
              atencion: "",
              comentarios: "",
            })
          }
        }

        systems.set(masterSystem.name, { name: masterSystem.name, components })
      }
    }

    return [...systems.values()]
  }
}
