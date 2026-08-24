import { NextResponse } from "next/server"

import { dashboardService, ensureBackendSeeded } from "@workspace/backend"

export async function GET() {
  await ensureBackendSeeded()
  const items = await dashboardService.getMonitor("comercial")
  return NextResponse.json(items)
}
