import { NextResponse } from "next/server"

import { ensureBackendSeeded, firstValidationError, overhaulService } from "@workspace/backend"
import { createNecesidadSchema } from "@workspace/backend/lib/validators/overhaul"

export async function POST(request: Request) {
  await ensureBackendSeeded()
  const body = await readJson(request)

  if (!body.success) {
    return NextResponse.json(
      { message: "El cuerpo de la solicitud no es JSON válido" },
      { status: 400 },
    )
  }

  const parsed = createNecesidadSchema.safeParse(body.data)
  if (!parsed.success) {
    return NextResponse.json(
      { message: firstValidationError(parsed.error) },
      { status: 400 },
    )
  }

  const result = await overhaulService.createNecesidad(parsed.data)
  return NextResponse.json(result, { status: 201 })
}

async function readJson(request: Request) {
  try {
    return { success: true as const, data: await request.json() }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo leer el cuerpo JSON"
    return { success: false as const, error: message }
  }
}
