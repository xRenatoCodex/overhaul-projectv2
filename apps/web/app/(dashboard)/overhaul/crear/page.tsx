"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CalendarDays, Plus, Trash2, Wrench } from "lucide-react"

import { createNecesidadSchema } from "@workspace/backend/lib/validators/overhaul"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"

import { FormMessage } from "@/components/form-message"
import { toFieldErrors, type FieldErrors } from "@/lib/form-errors"

type Machine = {
  model: string
  serial: string
}

const initialMachine: Machine = { model: "", serial: "" }

type NecesidadValues = {
  proyecto: string
  cliente: string
  ubicacion: string
  tallerDestino: string
  fechaEstimada: string
  fechaTarifa: string
  maquinas: Machine[]
}

const emptyValues: NecesidadValues = {
  proyecto: "",
  cliente: "",
  ubicacion: "",
  tallerDestino: "",
  fechaEstimada: "",
  fechaTarifa: "",
  maquinas: [{ ...initialMachine }],
}

type MasterDataOptions = {
  clientes: string[]
  talleres: string[]
  atenciones: string[]
  modelos: string[]
}

const emptyMasterData: MasterDataOptions = {
  clientes: [],
  talleres: [],
  atenciones: [],
  modelos: [],
}

export default function OverhaulCrearPage() {
  const router = useRouter()
  const [values, setValues] = useState<NecesidadValues>(emptyValues)
  const [showErrors, setShowErrors] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [masterData, setMasterData] = useState(emptyMasterData)

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

  useEffect(() => {
    const controller = new AbortController()

    fetch("/api/master-data", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("No se pudieron cargar los datos maestros")
        }
        return response.json() as Promise<MasterDataOptions>
      })
      .then(setMasterData)
      .catch(() => undefined)

    return () => controller.abort()
  }, [])

  function setValue<Key extends keyof NecesidadValues>(
    field: Key,
    value: NecesidadValues[Key],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function updateMachine(index: number, field: keyof Machine, value: string) {
    setValues((current) => ({
      ...current,
      maquinas: current.maquinas.map((machine, machineIndex) =>
        machineIndex === index ? { ...machine, [field]: value } : machine,
      ),
    }))
  }

  function addMachine() {
    setValue("maquinas", [...values.maquinas, { ...initialMachine }])
  }

  function removeMachine(index: number) {
    setValue(
      "maquinas",
      values.maquinas.filter((_, machineIndex) => machineIndex !== index),
    )
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
      const response = await fetch("/api/overhaul/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message ?? "No se pudo crear el overhaul.")
      }

      router.push(`/overhaul/${result.id}/necesidad`)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo crear el overhaul.",
      )
      setIsSubmitting(false)
    }
  }

  return (
    <section className="w-full h-full space-y-8 overflow-y-auto scrollbar-none">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Etapa 1 · Necesidad</p>
          <h1 className="text-3xl font-semibold tracking-tight">Crear overhaul</h1>
          <p className="max-w-2xl text-muted-foreground">
            Registra la necesidad inicial para comenzar la planificación del servicio.
          </p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground">
          <Wrench className="size-5" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <div className="space-y-5">
          <div>
            <h2 className="font-semibold">Información del proyecto</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Define el contexto comercial y la ubicación del overhaul.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Nombre del proyecto"
              htmlFor="proyecto"
              error={errorFor("proyecto")}
            >
              <Input
                id="proyecto"
                name="proyecto"
                placeholder="Overhaul excavadora 2026"
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
                placeholder="Nombre del cliente"
                list="clientes-mineros"
                value={values.cliente}
                onChange={(event) => setValue("cliente", event.target.value)}
                aria-invalid={Boolean(errorFor("cliente"))}
                required
              />
              <datalist id="clientes-mineros">
                {masterData.clientes.map((cliente) => (
                  <option key={cliente} value={cliente} />
                ))}
              </datalist>
            </Field>
            <Field
              label="Ubicación"
              htmlFor="ubicacion"
              error={errorFor("ubicacion")}
            >
              <Input
                id="ubicacion"
                name="ubicacion"
                placeholder="Ciudad o unidad operativa"
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
                placeholder="Taller principal"
                list="talleres-destino"
                value={values.tallerDestino}
                onChange={(event) => setValue("tallerDestino", event.target.value)}
                aria-invalid={Boolean(errorFor("tallerDestino"))}
                required
              />
              <datalist id="talleres-destino">
                {masterData.talleres.map((taller) => (
                  <option key={taller} value={taller} />
                ))}
              </datalist>
            </Field>
          </div>
        </div>

        <Separator />

        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">Fechas de referencia</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Indica cuándo se estima la reparación y cuándo debe estar lista la tarifa.
              </p>
            </div>
          </div>

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
        </div>

        <Separator />

        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold">Máquinas incluidas</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Añade cada máquina que formará parte del servicio.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={addMachine}>
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
                        id={`modelo-${index}`}
                        aria-label={`Modelo ${index + 1}`}
                        list="modelos-maquina"
                        value={machine.model}
                        onChange={(event) => updateMachine(index, "model", event.target.value)}
                        placeholder="CAT 336"
                        aria-invalid={Boolean(errorFor(`maquinas.${index}.model`))}
                        required
                      />
                      <FormMessage message={errorFor(`maquinas.${index}.model`)} />
                    </td>
                    <td className="space-y-1 p-2 align-top">
                      <Input
                        id={`serie-${index}`}
                        aria-label={`Serie ${index + 1}`}
                        value={machine.serial}
                        onChange={(event) => updateMachine(index, "serial", event.target.value)}
                        placeholder="ABC12345"
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
                        onClick={() => removeMachine(index)}
                        disabled={values.maquinas.length === 1}
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

          <datalist id="modelos-maquina">
            {masterData.modelos.map((modelo) => (
              <option key={modelo} value={modelo} />
            ))}
          </datalist>
        </div>

        {error ? (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Separator />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || !parsed.success}>
            {isSubmitting ? "Creando..." : "Crear overhaul"}
            {!isSubmitting ? <ArrowRight /> : null}
          </Button>
        </div>
      </form>
    </section>
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
