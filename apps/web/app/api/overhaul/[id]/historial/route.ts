import { NextResponse } from "next/server"

import {
  ensureBackendSeeded,
  NotFoundError,
  overhaulService,
} from "@workspace/backend"
import { getCurrentActor } from "@/lib/current-actor"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await ensureBackendSeeded()
  const { id } = await context.params
  const actor = await getCurrentActor()
  if (!actor) {
    return NextResponse.json(
      { message: "Debe estar logueado para acceder a este recurso" },
      { status: 401 },
    )
  }

  try {
    return NextResponse.json(await overhaulService.getHistory(id))
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 })
    }
    throw error
  }
}
