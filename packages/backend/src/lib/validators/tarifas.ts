import { z } from "zod"

import { formatValidationErrors } from "@workspace/backend/lib/validators/common"

const MAX_MONEY = 999_999_999_999.99
const MAX_TEXT = 500

const idSchema = z.string().trim().min(1).max(64).optional()
const textSchema = z.string().trim().min(1).max(MAX_TEXT)
const optionalTextSchema = z.string().trim().max(2_000).optional()
const positionSchema = z.number().int().min(0)
const nonNegativeNumberSchema = z.number().finite().min(0)
const moneySchema = nonNegativeNumberSchema.max(MAX_MONEY)

const tarifaJobSchema = z.object({
  id: idSchema,
  name: textSchema,
  materialAndMo: moneySchema,
  miscelaneos: moneySchema,
  repuestos: moneySchema,
  position: positionSchema,
})

const tarifaGroupSchema = z.object({
  id: idSchema,
  name: textSchema,
  horas: nonNegativeNumberSchema.max(100_000),
  position: positionSchema,
  jobs: z.array(tarifaJobSchema).max(1_000),
})

const tarifaParteSchema = z.object({
  id: idSchema,
  segmentacion: z.string().trim().max(MAX_TEXT),
  componentCode: z.string().trim().max(MAX_TEXT),
  jobCode: z.string().trim().max(MAX_TEXT),
  parentPartName: z.string().trim().max(MAX_TEXT),
  groupNumber: z.string().trim().max(MAX_TEXT),
  partNumber: textSchema,
  partNumberSap: z.string().trim().max(MAX_TEXT),
  partName: textSchema,
  quantity: nonNegativeNumberSchema.max(1_000_000),
  replacementPercent: nonNegativeNumberSchema.max(100),
  dealerNet: moneySchema,
  costoInterno: moneySchema,
  pu: moneySchema,
  subtotal: moneySchema,
  clasificacion: z.string().trim().max(MAX_TEXT),
  notas: optionalTextSchema,
  motivo: optionalTextSchema,
  position: positionSchema,
})

export const updateTarifasSchema = z
  .object({
    currency: z.enum(["USD", "PEN"]),
    groups: z.array(tarifaGroupSchema).max(100),
  })
  .superRefine((payload, context) => {
    validateUniquePositions(payload.groups, context, ["groups"])
    payload.groups.forEach((group, groupIndex) => {
      validateUniquePositions(group.jobs, context, ["groups", groupIndex, "jobs"])
    })
  })

export const updateTarifaRepuestosSchema = z
  .object({
    partes: z.array(tarifaParteSchema).max(10_000),
  })
  .superRefine((payload, context) => {
    validateUniquePositions(payload.partes, context, ["partes"])
  })

function validateUniquePositions(
  rows: { position: number }[],
  context: z.RefinementCtx,
  path: PropertyKey[],
) {
  const positions = new Set<number>()

  rows.forEach((row, index) => {
    if (positions.has(row.position)) {
      context.addIssue({
        code: "custom",
        message: "La posición no puede repetirse",
        path: [...path, index, "position"],
      })
    }
    positions.add(row.position)
  })
}

export { formatValidationErrors }
