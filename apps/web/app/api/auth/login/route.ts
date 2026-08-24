import { NextResponse } from "next/server"

import {
  authService,
  ensureBackendSeeded,
  firstValidationError,
  UnauthorizedError,
} from "@workspace/backend"
import { loginRequestSchema } from "@workspace/backend/lib/validators/auth"
import type {
  LoginErrorResponse,
  LoginResponse,
} from "@workspace/backend/types/auth"

export async function POST(request: Request) {
  await ensureBackendSeeded()
  const body = await readJson(request)

  if (!body.success) {
    return NextResponse.json<LoginErrorResponse>(
      { message: "El cuerpo de la solicitud no es JSON válido" },
      { status: 400 },
    )
  }

  const parsed = loginRequestSchema.safeParse(body.data)
  if (!parsed.success) {
    return NextResponse.json<LoginErrorResponse>(
      { message: firstValidationError(parsed.error) },
      { status: 400 },
    )
  }

  try {
    const result = await authService.login(parsed.data)
    return NextResponse.json<LoginResponse>(result)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json<LoginErrorResponse>(
        { message: error.message },
        { status: 401 },
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
