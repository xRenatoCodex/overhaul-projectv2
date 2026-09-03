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
import { SpreadsheetUpload } from "@/components/spreadsheet-upload"
import {
  StageLockBanner,
  StageLockFieldset,
  useStageLock,
} from "@/components/stage-lock"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"

import { TarifaGroupsEditor } from "./tarifa-groups-editor"
import { TarifaLoadDataModal } from "./tarifa-load-data-modal"

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

  // Modal state
  const [loadFile, setLoadFile] = useState<File | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const lock = useStageLock(initialTarifas.isCompleted, initialTarifas.version)

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

  function handleLoadData(file: File) {
    setLoadFile(file)
    setModalOpen(true)
  }

  function handleModalImported(importedCurrency: "USD" | "PEN") {
    setCurrency(importedCurrency)
    setIsDirty(false)
    setSuccess(false)
    router.refresh()
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
      lock.lockAgain()
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
    <>
      {loadFile ? (
        <TarifaLoadDataModal
          overhaulId={overhaulId}
          file={loadFile}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onImported={handleModalImported}
        />
      ) : null}

      <div className="flex flex-col gap-8">
        <StageLockBanner
          isLocked={lock.isLocked}
          isEditing={lock.isEditing}
          version={initialTarifas.version}
          nextVersion={lock.nextVersion}
          onStartNewVersion={lock.startNewVersion}
        />

        <StageLockFieldset isLocked={lock.isLocked} className="flex flex-col gap-8">
        {/* Archivo de trabajo */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="lg:w-64 lg:shrink-0">
            <h2 className="text-base font-semibold">Archivo de trabajo</h2>
            <p className="text-sm text-muted-foreground">
              Revisa la estructura del XLSX antes de definir su importación.
            </p>
          </div>
          <SpreadsheetUpload
            allowedKinds={["xlsx"]}
            label="Cargar XLSX"
            className="min-w-0 flex-1"
            onLoadData={handleLoadData}
          />
        </div>

        <Separator />

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

        <div>
          <h2 className="text-base font-semibold">Grupos y jobs</h2>
          <p className="text-sm text-muted-foreground">
            Organiza los trabajos en grupos con sus costos y horas.
          </p>
        </div>

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
        </StageLockFieldset>
      </div>
    </>
  )
}
