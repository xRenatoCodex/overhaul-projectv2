import type { PrismaClient } from "@prisma/client"

import { UserEntity } from "@workspace/backend/entities/user"
import type { IUserRepository } from "@workspace/backend/interfaces/repositories"

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async findByEmail(email: string): Promise<UserEntity | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return undefined
    }

    return new UserEntity(
      user.id,
      user.name,
      user.email,
      user.passwordHash,
      user.role,
    )
  }
}
