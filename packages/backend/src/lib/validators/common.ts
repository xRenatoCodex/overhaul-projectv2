import { z } from "zod"

export function formatValidationErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const field = issue.path.join(".")
    return field ? `${field}: ${issue.message}` : issue.message
  })
}

export function firstValidationError(error: z.ZodError): string {
  return formatValidationErrors(error)[0] ?? "Datos inválidos"
}
