"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

import { firstValidationError } from "@workspace/backend/lib/validators/common"
import { createNecesidadSchema } from "@workspace/backend/lib/validators/overhaul"
import type {
  MachineRequirement,
  OverhaulNecesidadData,
} from "@workspace/backend/types/overhaul"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"

type MasterDataOptions = {
  clientes: string[]
  talleres: string[]
  modelos: string[]
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
  const [machines, setMachines] = useState<MachineRequirement[]>(
    initialNecesidad.maquinas.length > 0
      ? initialNecesidad.maquinas
      : [{ model: "", serial: "" }],
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  function updateMachine(
    index: number,
    field: keyof MachineRequirement,
    value: string,
  ) {
    setMachines((current) =>
      current.map((machine, machineIndex) =>
        machineIndex === index ? { ...machine, [field]: value } : machine,
      ),
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const formData = new FormData(event.currentTarget)
    const payload = {
      proyecto: String(formData.get("proyecto") ?? "").trim(),
      cliente: String(formData.get("cliente") ?? "").trim(),
      ubicacion: String(formData.get("ubicacion") ?? "").trim(),
      tallerDestino: String(formData.get("tallerDestino") ?? "").trim(),
      fechaEstimada: String(formData.get("fechaEstimada") ?? ""),
      fechaTarifa: String(formData.get("fechaTarifa") ?? ""),
      maquinas: machines.map((machine) => ({
        model: machine.model.trim(),
        serial: machine.serial.trim(),
      })),
    }
    const parsed = createNecesidadSchema.safeParse(payload)

    if (!parsed.success) {
      setError(firstValidationError(parsed.error))
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nombre del proyecto" htmlFor="proyecto">
          <Input id="proyecto" name="proyecto" defaultValue={initialNecesidad.proyecto} required />
        </Field>
        <Field label="Cliente" htmlFor="cliente">
          <Input id="cliente" name="cliente" list="clientes" defaultValue={initialNecesidad.cliente} required />
        </Field>
        <Field label="Ubicación" htmlFor="ubicacion">
          <Input id="ubicacion" name="ubicacion" defaultValue={initialNecesidad.ubicacion} required />
        </Field>
        <Field label="Taller de destino" htmlFor="tallerDestino">
          <Input id="tallerDestino" name="tallerDestino" list="talleres" defaultValue={initialNecesidad.tallerDestino} required />
        </Field>
      </div>
      <datalist id="clientes">{masterData.clientes.map((cliente) => <option key={cliente} value={cliente} />)}</datalist>
      <datalist id="talleres">{masterData.talleres.map((taller) => <option key={taller} value={taller} />)}</datalist>

      <Separator />

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Fecha estimada de reparación" htmlFor="fechaEstimada">
          <Input id="fechaEstimada" name="fechaEstimada" type="date" defaultValue={toDateInput(initialNecesidad.fechaEstimada)} required />
        </Field>
        <Field label="Fecha límite para tarifa" htmlFor="fechaTarifa">
          <Input id="fechaTarifa" name="fechaTarifa" type="date" defaultValue={toDateInput(initialNecesidad.fechaTarifa)} required />
        </Field>
      </div>

      <Separator />

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Máquinas incluidas</h2>
          <Button type="button" variant="outline" onClick={() => setMachines((current) => [...current, { model: "", serial: "" }])}>
            <Plus />
            Añadir máquina
          </Button>
        </div>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground uppercase"><th className="px-3 py-2">Modelo</th><th className="px-3 py-2">Serie</th><th className="w-10 px-3 py-2" /></tr></thead>
            <tbody>{machines.map((machine, index) => (
              <tr key={index} className="border-b last:border-b-0">
                <td className="p-2"><Input aria-label={`Modelo ${index + 1}`} list="modelos" value={machine.model} onChange={(event) => updateMachine(index, "model", event.target.value)} required /></td>
                <td className="p-2"><Input aria-label={`Serie ${index + 1}`} value={machine.serial} onChange={(event) => updateMachine(index, "serial", event.target.value)} required /></td>
                <td className="p-2"><Button type="button" variant="ghost" size="icon" disabled={machines.length === 1} onClick={() => setMachines((current) => current.filter((_, machineIndex) => machineIndex !== index))} aria-label={`Eliminar máquina ${index + 1}`} title="Eliminar máquina"><Trash2 /></Button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <datalist id="modelos">{masterData.modelos.map((modelo) => <option key={modelo} value={modelo} />)}</datalist>
      </div>

      {error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

      <Separator />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar necesidad"}</Button>
      </div>
    </form>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>{children}</div>
}

function toDateInput(value: string) {
  return value.slice(0, 10)
}