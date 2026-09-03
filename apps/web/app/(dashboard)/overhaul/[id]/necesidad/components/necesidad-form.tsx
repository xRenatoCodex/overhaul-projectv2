"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

import { createNecesidadSchema } from "@workspace/backend/lib/validators/overhaul"
import type {
  MachineRequirement,
  OverhaulNecesidadData,
} from "@workspace/backend/types/overhaul"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"

import { FormMessage } from "@/components/form-message"
import {
  StageLockBanner,
  StageLockFieldset,
  useStageLock,
} from "@/components/stage-lock"
import { toFieldErrors, type FieldErrors } from "@/lib/form-errors"

type MasterDataOptions = {
  clientes: string[]
  talleres: string[]
  modelos: string[]
}

type NecesidadValues = {
  proyecto: string
  cliente: string
  ubicacion: string
  tallerDestino: string
  fechaEstimada: string
  fechaTarifa: string
  maquinas: MachineRequirement[]
}

export function NecesidadForm({
  overhaulId,
  initialNecesidad,
  masterData,
}: {
  overhaulId: string
  initialNecesidad: OverhaulNecesidadData
  masterData: MasterDataOptions
}) {
  const router = useRouter()
  const [values, setValues] = useState<NecesidadValues>(() => ({
    proyecto: initialNecesidad.proyecto,
    cliente: initialNecesidad.cliente,
    ubicacion: initialNecesidad.ubicacion,
    tallerDestino: initialNecesidad.tallerDestino,
    fechaEstimada: toDateInput(initialNecesidad.fechaEstimada),
    fechaTarifa: toDateInput(initialNecesidad.fechaTarifa),
    maquinas:
      initialNecesidad.maquinas.length > 0
        ? initialNecesidad.maquinas
        : [{ model: "", serial: "" }],
  }))
  const [showErrors, setShowErrors] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const lock = useStageLock(initialNecesidad.isCompleted, initialNecesidad.version)

  const parsed = useMemo(
    () =>
      createNecesidadSchema.safeParse({
        ...values,
        maquinas: values.maquinas.map((machine) => ({
          model: machine.model.trim(),
          serial: machine.serial.trim(),
        })),
      }),
    [values],
  )
  const fieldErrors: FieldErrors = parsed.success ? {} : toFieldErrors(parsed.error)
  const errorFor = (path: string) => (showErrors ? fieldErrors[path] : undefined)

  function setValue<Key extends keyof NecesidadValues>(
    field: Key,
    value: NecesidadValues[Key],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function updateMachine(
    index: number,
    field: keyof MachineRequirement,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      maquinas: current.maquinas.map((machine, machineIndex) =>
        machineIndex === index ? { ...machine, [field]: value } : machine,
      ),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setShowErrors(true)

    if (!parsed.success) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/overhaul/${overhaulId}/necesidad`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message ?? "No se pudo guardar la necesidad.")
      }

      lock.lockAgain()
      setShowErrors(false)
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar la necesidad.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <StageLockBanner
        isLocked={lock.isLocked}
        isEditing={lock.isEditing}
        version={initialNecesidad.version}
        nextVersion={lock.nextVersion}
        onStartNewVersion={lock.startNewVersion}
      />

      <StageLockFieldset isLocked={lock.isLocked} className="space-y-8">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Nombre del proyecto"
            htmlFor="proyecto"
            error={errorFor("proyecto")}
          >
            <Input
              id="proyecto"
              name="proyecto"
              value={values.proyecto}
              onChange={(event) => setValue("proyecto", event.target.value)}
              aria-invalid={Boolean(errorFor("proyecto"))}
              required
            />
          </Field>
          <Field label="Cliente" htmlFor="cliente" error={errorFor("cliente")}>
            <Input
              id="cliente"
              name="cliente"
              list="clientes"
              value={values.cliente}
              onChange={(event) => setValue("cliente", event.target.value)}
              aria-invalid={Boolean(errorFor("cliente"))}
              required
            />
          </Field>
          <Field label="Ubicación" htmlFor="ubicacion" error={errorFor("ubicacion")}>
            <Input
              id="ubicacion"
              name="ubicacion"
              value={values.ubicacion}
              onChange={(event) => setValue("ubicacion", event.target.value)}
              aria-invalid={Boolean(errorFor("ubicacion"))}
              required
            />
          </Field>
          <Field
            label="Taller de destino"
            htmlFor="tallerDestino"
            error={errorFor("tallerDestino")}
          >
            <Input
              id="tallerDestino"
              name="tallerDestino"
              list="talleres"
              value={values.tallerDestino}
              onChange={(event) => setValue("tallerDestino", event.target.value)}
              aria-invalid={Boolean(errorFor("tallerDestino"))}
              required
            />
          </Field>
        </div>
        <datalist id="clientes">
          {masterData.clientes.map((cliente) => (
            <option key={cliente} value={cliente} />
          ))}
        </datalist>
        <datalist id="talleres">
          {masterData.talleres.map((taller) => (
            <option key={taller} value={taller} />
          ))}
        </datalist>

        <Separator />

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Fecha estimada de reparación"
            htmlFor="fechaEstimada"
            error={errorFor("fechaEstimada")}
          >
            <Input
              id="fechaEstimada"
              name="fechaEstimada"
              type="date"
              value={values.fechaEstimada}
              onChange={(event) => setValue("fechaEstimada", event.target.value)}
              aria-invalid={Boolean(errorFor("fechaEstimada"))}
              required
            />
          </Field>
          <Field
            label="Fecha límite para tarifa"
            htmlFor="fechaTarifa"
            error={errorFor("fechaTarifa")}
          >
            <Input
              id="fechaTarifa"
              name="fechaTarifa"
              type="date"
              value={values.fechaTarifa}
              onChange={(event) => setValue("fechaTarifa", event.target.value)}
              aria-invalid={Boolean(errorFor("fechaTarifa"))}
              required
            />
          </Field>
        </div>

        <Separator />

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Máquinas incluidas</h2>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setValue("maquinas", [
                  ...values.maquinas,
                  { model: "", serial: "" },
                ])
              }
            >
              <Plus />
              Añadir máquina
            </Button>
          </div>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground uppercase">
                  <th className="px-3 py-2">Modelo</th>
                  <th className="px-3 py-2">Serie</th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {values.maquinas.map((machine, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="space-y-1 p-2 align-top">
                      <Input
                        aria-label={`Modelo ${index + 1}`}
                        list="modelos"
                        value={machine.model}
                        onChange={(event) =>
                          updateMachine(index, "model", event.target.value)
                        }
                        aria-invalid={Boolean(errorFor(`maquinas.${index}.model`))}
                        required
                      />
                      <FormMessage message={errorFor(`maquinas.${index}.model`)} />
                    </td>
                    <td className="space-y-1 p-2 align-top">
                      <Input
                        aria-label={`Serie ${index + 1}`}
                        value={machine.serial}
                        onChange={(event) =>
                          updateMachine(index, "serial", event.target.value)
                        }
                        aria-invalid={Boolean(errorFor(`maquinas.${index}.serial`))}
                        required
                      />
                      <FormMessage message={errorFor(`maquinas.${index}.serial`)} />
                    </td>
                    <td className="p-2 align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={values.maquinas.length === 1}
                        onClick={() =>
                          setValue(
                            "maquinas",
                            values.maquinas.filter(
                              (_, machineIndex) => machineIndex !== index,
                            ),
                          )
                        }
                        aria-label={`Eliminar máquina ${index + 1}`}
                        title="Eliminar máquina"
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <FormMessage message={errorFor("maquinas")} />
          <datalist id="modelos">
            {masterData.modelos.map((modelo) => (
              <option key={modelo} value={modelo} />
            ))}
          </datalist>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        <Separator />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || !parsed.success}>
            {isSubmitting ? "Guardando..." : "Guardar necesidad"}
          </Button>
        </div>
      </StageLockFieldset>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      <FormMessage message={error} />
    </div>
  )
}

function toDateInput(value: string) {
  return value.slice(0, 10)
}