"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Plus, Trash2 } from "lucide-react"

import { firstValidationError } from "@workspace/backend/lib/validators/common"
import { createUpdateAlcanceSchemaWithMasterData } from "@workspace/backend/lib/validators/overhaul"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import type {
  AlcanceComponent,
  AlcanceSystem,
  ComponentState,
} from "@workspace/backend/types/overhaul"

import { MarkdownCommentDialog } from "./markdown-comment-dialog"

const componentStates: { value: ComponentState; label: string }[] = [
  { value: "Nuevo", label: "Nuevo" },
  { value: "Reman", label: "Reman" },
  { value: "RGeneral", label: "Rep. Gral" },
  { value: "Resellado", label: "Resellado" },
  { value: "Reutilizar", label: "Reutilizar" },
  { value: "Cliente", label: "Cliente" },
]

const emptyComponent: AlcanceComponent = {
  name: "",
  state: "Nuevo",
  taller: "",
  atencion: "",
  comentarios: "",
}

function emptySystem(): AlcanceSystem {
  return { name: "", components: [{ ...emptyComponent }] }
}

export function AlcanceForm({
  overhaulId,
  initialSystems,
  talleres,
  atenciones,
}: {
  overhaulId: string
  initialSystems: AlcanceSystem[]
  talleres: string[]
  atenciones: string[]
}) {
  const router = useRouter()
  const [systems, setSystems] = useState<AlcanceSystem[]>(
    initialSystems.length > 0 ? initialSystems : [emptySystem()],
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  function updateSystemName(systemIndex: number, name: string) {
    setSystems((current) =>
      current.map((system, index) =>
        index === systemIndex ? { ...system, name } : system,
      ),
    )
  }

  function addSystem() {
    setSystems((current) => [...current, emptySystem()])
  }

  function removeSystem(systemIndex: number) {
    setSystems((current) => current.filter((_, index) => index !== systemIndex))
  }

  function addComponent(systemIndex: number) {
    setSystems((current) =>
      current.map((system, index) =>
        index === systemIndex
          ? { ...system, components: [...system.components, { ...emptyComponent }] }
          : system,
      ),
    )
  }

  function removeComponent(systemIndex: number, componentIndex: number) {
    setSystems((current) =>
      current.map((system, index) =>
        index === systemIndex
          ? {
              ...system,
              components: system.components.filter(
                (_, componentIdx) => componentIdx !== componentIndex,
              ),
            }
          : system,
      ),
    )
  }

  function updateComponent(
    systemIndex: number,
    componentIndex: number,
    field: keyof AlcanceComponent,
    value: string,
  ) {
    setSystems((current) =>
      current.map((system, index) =>
        index === systemIndex
          ? {
              ...system,
              components: system.components.map((component, componentIdx) =>
                componentIdx === componentIndex
                  ? { ...component, [field]: value }
                  : component,
              ),
            }
          : system,
      ),
    )
  }

  async function handleSubmit() {
    setError("")
    setSuccess(false)

    const payload = {
      systems: systems
        .map((system) => ({
          name: system.name.trim(),
          components: system.components
            .map((component) => ({
              name: component.name.trim(),
              state: component.state,
              taller: component.taller?.trim() ?? "",
              atencion: component.atencion?.trim() ?? "",
              comentarios: component.comentarios?.trim() ?? "",
            }))
            .filter((component) => component.name !== ""),
        }))
        .filter((system) => system.name !== "" && system.components.length > 0),
    }

    const parsed = createUpdateAlcanceSchemaWithMasterData({
      talleres,
      atenciones,
    }).safeParse(payload)
    if (!parsed.success) {
      setError(firstValidationError(parsed.error))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/overhaul/${overhaulId}/alcance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message ?? "No se pudo guardar el alcance.")
      }

      setSuccess(true)
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar el alcance.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {systems.map((system, systemIndex) => (
        <div key={systemIndex} className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              value={system.name}
              onChange={(event) => updateSystemName(systemIndex, event.target.value)}
              placeholder="Nombre del sistema (ej. Power train)"
              className="max-w-sm font-medium"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSystem(systemIndex)}
              disabled={systems.length === 1}
              aria-label="Eliminar sistema"
              title="Eliminar sistema"
            >
              <Trash2 />
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-275 w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground uppercase">
                  <th className="px-3 py-2">Componente</th>
                  {componentStates.map((option) => (
                    <th key={option.value} className="px-2 py-2 text-center">
                      {option.label}
                    </th>
                  ))}
                  <th className="px-3 py-2">Taller</th>
                  <th className="px-3 py-2">Atención</th>
                  <th className="px-3 py-2">Comentarios</th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {system.components.map((component, componentIndex) => (
                  <tr key={componentIndex} className="border-b last:border-b-0">
                    <td className="p-2 align-top">
                      <Input
                        aria-label="Nombre del componente"
                        value={component.name}
                        onChange={(event) =>
                          updateComponent(
                            systemIndex,
                            componentIndex,
                            "name",
                            event.target.value,
                          )
                        }
                        placeholder="Motor"
                      />
                    </td>
                    {componentStates.map((option) => {
                      const isSelected = component.state === option.value

                      return (
                        <td key={option.value} className="p-1 text-center align-top">
                          <button
                            type="button"
                            aria-label={`Estado ${option.label}`}
                            aria-pressed={isSelected}
                            onClick={() =>
                              updateComponent(
                                systemIndex,
                                componentIndex,
                                "state",
                                option.value,
                              )
                            }
                            className={cn(
                              "mx-auto flex size-8 items-center justify-center rounded-md border transition-colors",
                              isSelected
                                ? "border-emerald-600 bg-emerald-100 text-emerald-700"
                                : "border-input bg-transparent text-transparent hover:bg-muted hover:text-muted-foreground",
                            )}
                          >
                            <Check className="size-4" />
                          </button>
                        </td>
                      )
                    })}
                    <td className="p-2 align-top">
                      <select
                        aria-label="Taller"
                        value={component.taller ?? ""}
                        onChange={(event) =>
                          updateComponent(
                            systemIndex,
                            componentIndex,
                            "taller",
                            event.target.value,
                          )
                        }
                        className="h-8 w-full min-w-32 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                      >
                        <option value="">Seleccionar</option>
                        {talleres.map((taller) => (
                          <option key={taller} value={taller}>
                            {taller}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 align-top">
                      <select
                        aria-label="Atención"
                        value={component.atencion ?? ""}
                        onChange={(event) =>
                          updateComponent(
                            systemIndex,
                            componentIndex,
                            "atencion",
                            event.target.value,
                          )
                        }
                        className="h-8 w-full min-w-36 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                      >
                        <option value="">Seleccionar</option>
                        {atenciones.map((atencion) => (
                          <option key={atencion} value={atencion}>
                            {atencion}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 align-top">
                      <MarkdownCommentDialog
                        componentName={component.name}
                        value={component.comentarios ?? ""}
                        onSave={(value) =>
                          updateComponent(
                            systemIndex,
                            componentIndex,
                            "comentarios",
                            value,
                          )
                        }
                      />
                    </td>
                    <td className="p-2 align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeComponent(systemIndex, componentIndex)}
                        disabled={system.components.length === 1}
                        aria-label="Eliminar componente"
                        title="Eliminar componente"
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addComponent(systemIndex)}
          >
            <Plus />
            Añadir componente
          </Button>

          <Separator />
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addSystem}>
        <Plus />
        Añadir sistema
      </Button>

      {error ? (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          Alcance guardado correctamente.
        </p>
      ) : null}

      <Separator />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar alcance"}
        </Button>
      </div>
    </div>
  )
}
