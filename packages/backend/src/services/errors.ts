export class UnauthorizedError extends Error {
  constructor(message = "Credenciales invalidas") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

export class NotFoundError extends Error {
  constructor(message = "Registro no encontrado") {
    super(message)
    this.name = "NotFoundError"
  }
}
