import { Currency } from "@prisma/client"
import { prisma } from "@workspace/backend/lib/prisma"
import { seedApplicationData } from "@workspace/backend/lib/seed"
import { PrismaOverhaulRepository } from "@workspace/backend/repositories/prisma-overhaul-repository"
import { PrismaUserRepository } from "@workspace/backend/repositories/prisma-user-repository"
import { AuthService } from "@workspace/backend/services/auth-service"
import { DashboardService } from "@workspace/backend/services/dashboard-service"
import { MasterDataService } from "@workspace/backend/services/master-data-service"
import { OverhaulService } from "@workspace/backend/services/overhaul-service"
import type { CreateNecesidadInput } from "@workspace/backend/types/overhaul"

const seedNecesidad: CreateNecesidadInput = {
  proyecto: "OH-2026-001",
  cliente: "Antamina",
  ubicacion: "Lima",
  tallerDestino: "Lima",
  fechaEstimada: new Date().toISOString(),
  fechaTarifa: new Date().toISOString(),
  maquinas: [{ model: "797F", serial: "SN-001" }],
}

const userRepository = new PrismaUserRepository(prisma)
const overhaulRepository = new PrismaOverhaulRepository(prisma)

export const authService = new AuthService(userRepository)
export const overhaulService = new OverhaulService(overhaulRepository)
export const dashboardService = new DashboardService(overhaulRepository)
export const masterDataService = new MasterDataService(prisma)
let seedPromise: Promise<void> | undefined

export async function ensureBackendSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seedBackendData()
  }
  return seedPromise
}

async function seedBackendData(): Promise<void> {
  await seedApplicationData(prisma)

  const overhaulCount = await prisma.overhaul.count()
  if (overhaulCount > 0) {
    return
  }

  await prisma.overhaul.create({
    data: {
      necesidad: {
        create: {
          proyecto: seedNecesidad.proyecto,
          cliente: seedNecesidad.cliente,
          ubicacion: seedNecesidad.ubicacion,
          tallerDestino: seedNecesidad.tallerDestino,
          fechaEstimada: new Date(seedNecesidad.fechaEstimada),
          fechaTarifa: new Date(seedNecesidad.fechaTarifa),
          maquinas: seedNecesidad.maquinas,
        },
      },
      alcance: { create: { resumen: "", systems: [] } },
      tarifas: { create: { currency: Currency.USD, total: 0 } },
      propuesta: { create: { documento: "" } },
      planificacion: { create: {} },
    },
  })
}

export * from "@workspace/backend/entities/overhaul"
export * from "@workspace/backend/entities/user"
export * from "@workspace/backend/interfaces/repositories"
export * from "@workspace/backend/interfaces/services"
export * from "@workspace/backend/lib/prisma"
export * from "@workspace/backend/services/master-data-service"
export * from "@workspace/backend/services/errors"
export * from "@workspace/backend/types/auth"
export * from "@workspace/backend/types/overhaul"
export * from "@workspace/backend/lib/validators/common"
export * from "@workspace/backend/validators/tarifas"
