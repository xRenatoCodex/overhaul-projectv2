"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import { firstValidationError } from "@workspace/backend/lib/validators/common"
import { updateTarifaRepuestosSchema } from "@workspace/backend/lib/validators/tarifas"
import type {
  OverhaulTarifasData,
  TarifaParte,
} from "@workspace/backend/types/overhaul"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"

import { TarifaRepuestosTable } from "./tarifa-repuestos-table"

export function TarifaRepuestosForm({
  overhaulId,
  initialTarifas,
}: {
  overhaulId: string
  initialTarifas: OverhaulTarifasData
}) {
  const router = useRouter()
  const [partes, setPartes] = useState<TarifaParte[]>(initialTarifas.partes)
  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useUnsavedChanges(isDirty)

  function handleChange(nextPartes: TarifaParte[]) {
    setPartes(nextPartes)
    setIsDirty(true)
    setSuccess(false)
  }

  function handleBack() {
    if (isDirty && !window.confirm("Hay cambios sin guardar. ¿Salir de todos modos?")) {
      return
    }
    router.back()
  }

  async function handleSubmit() {
    setError("")
    setSuccess(false)

    const normalizedPartes = partes.map((parte, position) => ({
      ...parte,
      segmentacion: parte.segmentacion.trim(),
      componentCode: parte.componentCode.trim(),
      jobCode: parte.jobCode.trim(),
      parentPartName: parte.parentPartName.trim(),
      groupNumber: parte.groupNumber.trim(),
      partNumber: parte.partNumber.trim(),
      partNumberSap: parte.partNumberSap.trim(),
      partName: parte.partName.trim(),
      clasificacion: parte.clasificacion.trim(),
      notas: parte.notas?.trim(),
      motivo: parte.motivo?.trim(),
      subtotal: roundMoney(parte.quantity * parte.pu),
      position,
    }))

    const parsed = updateTarifaRepuestosSchema.safeParse({
      partes: normalizedPartes,
    })
    if (!parsed.success) {
      setError(firstValidationError(parsed.error))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/overhaul/${overhaulId}/tarifas/repuestos`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      )
      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.details?.[0] ?? result.error ?? "No se pudieron guardar los repuestos.",
        )
      }

      setPartes(result.data.tarifas.partes)
      setIsDirty(false)
      setSuccess(true)
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudieron guardar los repuestos.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <TarifaRepuestosTable partes={partes} onChange={handleChange} />

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Repuestos guardados</AlertTitle>
          <AlertDescription>
            La tabla fue actualizada y la tarifa generó una nueva versión.
          </AlertDescription>
        </Alert>
      ) : null}

      <Separator />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={handleBack}>
          Volver
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar repuestos"}
        </Button>
      </div>
    </div>
  )
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}