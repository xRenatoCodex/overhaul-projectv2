import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"

export type ApiHandler = (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<Response>

export function withAuth(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { message: "Debe estar logueado para acceder a este recurso" },
        { status: 401 }
      )
    }

    return handler(request, context)
  }
}
