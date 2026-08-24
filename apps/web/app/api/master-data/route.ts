import { NextResponse } from "next/server"

import { ensureBackendSeeded, masterDataService } from "@workspace/backend"

export async function GET() {
  await ensureBackendSeeded()
  const options = await masterDataService.getOptions()
  return NextResponse.json(options)
}
