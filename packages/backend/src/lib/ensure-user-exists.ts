import { prisma } from "@workspace/backend/lib/prisma"
import { UserRole } from "@prisma/client"

/**
 * @deprecated Users must be pre-seeded or created during authentication setup.
 * Attempting to create users on-demand in API routes is a security risk
 * and causes constraint violations when users already exist.
 * 
 * This function is kept for historical reference only and should not be used.
 */
export async function ensureUserExists(
  userId: string,
  name: string,
  email: string,
  role: string = "commercial",
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    // User doesn't exist, create it
    await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        passwordHash: "auto-generated-from-session",
        role: (role as UserRole) || UserRole.commercial,
      },
    })
  }
}
