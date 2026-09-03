import { NextResponse } from "next/server"

import {
  ensureBackendSeeded,
  firstValidationError,
  formatValidationErrors,
  masterDataService,
  NotFoundError,
  overhaulService,
} from "@workspace/backend"
import { createUpdateAlcanceSchemaWithMasterData } from "@workspace/backend/lib/validators/overhaul"
import { getCurrentActor } from "@/lib/current-actor"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await ensureBackendSeeded()
  const { id } = await context.params
  const body = await readJson(request)

  if (!body.success) {
    return NextResponse.json(
      { message: "El cuerpo de la solicitud no es JSON válido" },
      { status: 400 },
    )
  }

  const masterOptions = await masterDataService.getOptions()
  const parsed = createUpdateAlcanceSchemaWithMasterData({
    talleres: masterOptions.talleres,
    atenciones: masterOptions.atenciones,
  }).safeParse(body.data)

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: firstValidationError(parsed.error),
        details: formatValidationErrors(parsed.error),
      },
      { status: 400 },
    )
  }

  try {
    const result = await overhaulService.updateAlcance(
      id,
      parsed.data,
      await getCurrentActor(),
    )
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 })
    }
    throw error
  }
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
