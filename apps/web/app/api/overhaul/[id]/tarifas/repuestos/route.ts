import { NextResponse } from "next/server"

import {
  ensureBackendSeeded,
  formatValidationErrors,
  NotFoundError,
  overhaulService,
  updateTarifaRepuestosSchema,
} from "@workspace/backend"
import { getCurrentActor } from "@/lib/current-actor"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await ensureBackendSeeded()
  const { id } = await context.params
  const actor = await getCurrentActor()
  if (!actor) {
    return NextResponse.json(
      { success: false, error: "Debe estar logueado para actualizar este recurso" },
      { status: 401 },
    )
  }
  const body = await readJson(request)

  if (!body.success) {
    return NextResponse.json(
      { success: false, error: "El cuerpo de la solicitud no es JSON válido" },
      { status: 400 },
    )
  }

  const parsed = updateTarifaRepuestosSchema.safeParse(body.data)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Los repuestos contienen datos inválidos",
        details: formatValidationErrors(parsed.error),
      },
      { status: 400 },
    )
  }

  try {
    const result = await overhaulService.updateTarifaRepuestos(
      id,
      parsed.data,
      actor,
    )
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 },
      )
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
