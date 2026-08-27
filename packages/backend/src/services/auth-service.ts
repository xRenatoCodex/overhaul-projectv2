import type { IUserRepository } from "@workspace/backend/interfaces/repositories"
import type { IAuthService } from "@workspace/backend/interfaces/services"
import type { LoginRequest, LoginResponse } from "@workspace/backend/types/auth"
import { UnauthorizedError } from "@workspace/backend/services/errors"

function createSessionToken(): string {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error("Secure random UUID generation is not available in this runtime.")
  }

  return globalThis.crypto.randomUUID()
}

export class AuthService implements IAuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  public async login(input: LoginRequest): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(input.email)
    if (!user) {
      throw new UnauthorizedError()
    }

    const validPassword = user.verifyPassword(input.password)
    if (!validPassword) {
      throw new UnauthorizedError()
    }

    return {
      token: createSessionToken(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }
  }
}
