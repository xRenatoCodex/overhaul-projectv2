import { NextResponse } from "next/server"

import { ensureBackendSeeded, masterDataService } from "@workspace/backend"
import { getCurrentActor } from "@/lib/current-actor"

export async function GET() {
  const actor = await getCurrentActor()
  if (!actor) {
    return NextResponse.json(
      { message: "Debe estar logueado para acceder a este recurso" },
      { status: 401 },
    )
  }
  await ensureBackendSeeded()
  const options = await masterDataService.getOptions()
  return NextResponse.json(options)
}
