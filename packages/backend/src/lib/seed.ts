import { UserRole, type PrismaClient } from "@prisma/client"

import { atenciones } from "@workspace/backend/data/atenciones"
import { clientesMineros } from "@workspace/backend/data/clientes-mineros"
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
  ])

  const modelo = await prisma.masterMaquinaModelo.upsert({
    where: { modelo: "797F" },
    update: { type: "Camión minero" },
    create: {
      modelo: "797F",
      type: "Camión minero",
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

  const email = "comercial@overhaul.local"
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
