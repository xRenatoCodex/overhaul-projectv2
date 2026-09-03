import type { z } from "zod"

export type FieldErrors = Record<string, string>

/** Flattens a Zod error into `path.to.field -> message` (first message wins). */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {}

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form"
    if (!errors[key]) {
      errors[key] = issue.message
    }
  }

  return errors
}
