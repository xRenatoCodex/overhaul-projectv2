import { NextResponse } from "next/server"

import { dashboardService, ensureBackendSeeded } from "@workspace/backend"
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
  const items = await dashboardService.getMonitor("comercial")
  return NextResponse.json(items)
}
