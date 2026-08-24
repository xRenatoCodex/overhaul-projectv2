import type { UserRole } from "@workspace/backend/types/auth"

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
  ) {}

  public verifyPassword(rawPassword: string): boolean {
    return this.passwordHash === rawPassword
  }
}
