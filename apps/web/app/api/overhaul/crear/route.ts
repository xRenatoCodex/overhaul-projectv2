import { NextResponse } from "next/server"

import { 
  ensureBackendSeeded, 
  firstValidationError, 
  overhaulService,
} from "@workspace/backend"
import { createNecesidadSchema } from "@workspace/backend/lib/validators/overhaul"
import { auth } from "@/auth"

export async function POST(request: Request) {
  try {
    await ensureBackendSeeded()
    
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Debe estar logueado para crear un overhaul" },
        { status: 401 },
      )
    }

    const body = await readJson(request)

    if (!body.success) {
      return NextResponse.json(
        { message: "El cuerpo de la solicitud no es JSON válido", error: body.error },
        { status: 400 },
      )
    }

    const parsed = createNecesidadSchema.safeParse(body.data)
    if (!parsed.success) {
      return NextResponse.json(
        { message: firstValidationError(parsed.error) },
        { status: 400 },
      )
    }

    const result = await overhaulService.createNecesidad(
      parsed.data,
      {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.name || "Usuario",
      },
    )
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error en POST /api/overhaul/crear:", error)
    return NextResponse.json(
      { 
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
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
