export type UserRole = "admin" | "commercial" | "pricing" | "planning"

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: UserRole
  }
}

export type LoginErrorResponse = {
  message: string
}
