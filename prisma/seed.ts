import { PrismaClient } from "@prisma/client"

import { seedApplicationData } from "@workspace/backend/lib/seed"

const prisma = new PrismaClient()

async function main() {
  await seedApplicationData(prisma)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
