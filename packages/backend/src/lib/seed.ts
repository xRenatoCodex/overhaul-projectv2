import { UserRole, type PrismaClient } from "@prisma/client"

import { atenciones } from "@workspace/backend/data/atenciones"
import { clientesMineros } from "@workspace/backend/data/clientes-mineros"
import { fabricantes } from "@workspace/backend/data/fabricantes"
import { modelosMaquina } from "@workspace/backend/data/modelos-maquina"
import { sistemas797F } from "@workspace/backend/data/sistemas-797f"
import { talleres } from "@workspace/backend/data/talleres"

export async function seedMasterData(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    ...clientesMineros.map((name) =>
      prisma.masterCliente.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
    ...talleres.map((name) =>
      prisma.masterTaller.upsert({
        where: { name },
        update: {},
        create: { name, location: name },
      }),
    ),
    ...atenciones.map((name) =>
      prisma.masterAtencion.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
    ...fabricantes.map((name) =>
      prisma.masterFabricante.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  ])

  const fabricanteByName = new Map(
    (await prisma.masterFabricante.findMany()).map((fabricante) => [fabricante.name, fabricante.id]),
  )

  await prisma.$transaction(
    modelosMaquina.map(({ modelo, fabricante, type, flota, categoria }) =>
      prisma.masterMaquinaModelo.upsert({
        where: { modelo },
        update: { type, flota, categoria, fabricanteId: fabricanteByName.get(fabricante) },
        create: { modelo, type, flota, categoria, fabricanteId: fabricanteByName.get(fabricante) },
      }),
    ),
  )

  const modelo = await prisma.masterMaquinaModelo.upsert({
    where: { modelo: "797F" },
    update: { description: "Camión de acarreo minero Caterpillar 797F" },
    create: {
      modelo: "797F",
      type: "Camión Minero",
      description: "Camión de acarreo minero Caterpillar 797F",
    },
  })

  for (const systemSeed of sistemas797F) {
    const system = await prisma.masterSystem.upsert({
      where: {
        modeloId_name: {
          modeloId: modelo.id,
          name: systemSeed.sistema,
        },
      },
      update: {},
      create: {
        modeloId: modelo.id,
        name: systemSeed.sistema,
      },
    })

    await prisma.$transaction(
      systemSeed.componentes.map((name) =>
        prisma.masterComponent.upsert({
          where: {
            systemId_name: {
              systemId: system.id,
              name,
            },
          },
          update: {},
          create: { systemId: system.id, name },
        }),
      ),
    )
  }
}

export async function seedApplicationData(prisma: PrismaClient): Promise<void> {
  await seedMasterData(prisma)

  const email = "comercial@ferreyros.com.pe"
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Usuario Comercial",
      email,
      passwordHash: "123456",
      role: UserRole.commercial,
    },
  })
}
