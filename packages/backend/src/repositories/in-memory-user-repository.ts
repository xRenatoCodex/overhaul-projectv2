import { UserEntity } from "@workspace/backend/entities/user"
import type { IUserRepository } from "@workspace/backend/interfaces/repositories"

export class InMemoryUserRepository implements IUserRepository {
  private readonly users = new Map<string, UserEntity>()

  constructor(seedUsers: UserEntity[]) {
    for (const user of seedUsers) {
      this.users.set(user.email.toLowerCase(), user)
    }
  }

  public async findByEmail(email: string): Promise<UserEntity | undefined> {
    return this.users.get(email.toLowerCase())
  }
}
