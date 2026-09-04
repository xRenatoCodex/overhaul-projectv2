import { NextResponse } from "next/server"

import {
  ensureBackendSeeded,
  firstValidationError,
  NotFoundError,
  overhaulService,
} from "@workspace/backend"
import { overhaulStageSchema } from "@workspace/backend/lib/validators/overhaul"
import { getCurrentActor } from "@/lib/current-actor"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; stage: string }> },
) {
  await ensureBackendSeeded()
  const { id, stage } = await context.params
  const actor = await getCurrentActor()
  if (!actor) {
    return NextResponse.json(
      { message: "Debe estar logueado para acceder a este recurso" },
      { status: 401 },
    )
  }

  const parsed = overhaulStageSchema.safeParse(stage)
  if (!parsed.success) {
    return NextResponse.json(
      { message: firstValidationError(parsed.error) },
      { status: 400 },
    )
  }

  try {
    const data = await overhaulService.getStageData(id, parsed.data)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 })
    }

    throw error
  }
}
