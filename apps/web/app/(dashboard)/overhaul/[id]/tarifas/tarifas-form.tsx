"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import { firstValidationError } from "@workspace/backend/lib/validators/common"
import { updateTarifasSchema } from "@workspace/backend/lib/validators/tarifas"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import type {
  OverhaulTarifasData,
  TarifaGroupJob,
} from "@workspace/backend/types/overhaul"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"

import { TarifaGroupsEditor } from "./tarifa-groups-editor"

export function TarifasForm({
  overhaulId,
  initialTarifas,
}: {
  overhaulId: string
  initialTarifas: OverhaulTarifasData
}) {
  const router = useRouter()
  const [currency, setCurrency] = useState(initialTarifas.currency)
  const [groups, setGroups] = useState<TarifaGroupJob[]>(initialTarifas.groups)
  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useUnsavedChanges(isDirty)

  function handleCurrencyChange(value: "USD" | "PEN") {
    setCurrency(value)
    setIsDirty(true)
    setSuccess(false)
  }

  function handleGroupsChange(nextGroups: TarifaGroupJob[]) {
    setGroups(nextGroups)
    setIsDirty(true)
    setSuccess(false)
  }

  function handleCancel() {
    if (isDirty && !window.confirm("Hay cambios sin guardar. ¿Salir de todos modos?")) {
      return
    }
    router.back()
  }

  async function handleSubmit() {
    setError("")
    setSuccess(false)

    const normalizedGroups = groups.map((group, groupPosition) => ({
      ...group,
      name: group.name.trim(),
      position: groupPosition,
      jobs: group.jobs.map((job, jobPosition) => ({
        ...job,
        name: job.name.trim(),
        position: jobPosition,
      })),
    }))

    const parsed = updateTarifasSchema.safeParse({
      currency,
      groups: normalizedGroups,
    })
    if (!parsed.success) {
      setError(firstValidationError(parsed.error))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/overhaul/${overhaulId}/tarifas`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.details?.[0] ?? result.error ?? "No se pudo guardar la tarifa.",
        )
      }

      setGroups(result.data.tarifas.groups)
      setIsDirty(false)
      setSuccess(true)
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar la tarifa.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Field className="max-w-48">
        <FieldLabel>Moneda</FieldLabel>
        <Select
          value={currency}
          onValueChange={(value) => handleCurrencyChange(value as "USD" | "PEN")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar moneda" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="USD">USD · Dólar</SelectItem>
              <SelectItem value="PEN">PEN · Sol</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <TarifaGroupsEditor
        groups={groups}
        currency={currency}
        onChange={handleGroupsChange}
      />

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
          <AlertTitle>Tarifa guardada</AlertTitle>
          <AlertDescription>
            Los grupos, jobs y el resumen fueron actualizados.
          </AlertDescription>
        </Alert>
      ) : null}

      <Separator />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar tarifas"}
        </Button>
      </div>
    </div>
  )
}
