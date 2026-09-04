export type UserRole = "admin" | "commercial" | "pricing" | "planning"

export type AuthUser = {
  id: string
  email: string
  name: string
  role?: UserRole
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  user: AuthUser
}

export type LoginErrorResponse = {
  message: string
}
