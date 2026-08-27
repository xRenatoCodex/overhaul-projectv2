"use client"

import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import type { TarifaGroupJob } from "@workspace/backend/types/overhaul"

import { TarifaJobsTable } from "./tarifa-jobs-table"

export function TarifaGroupsEditor({
  groups,
  currency,
  onChange,
}: {
  groups: TarifaGroupJob[]
  currency: "USD" | "PEN"
  onChange: (groups: TarifaGroupJob[]) => void
}) {
  function updateGroup(index: number, patch: Partial<TarifaGroupJob>) {
    onChange(
      groups.map((group, groupIndex) =>
        groupIndex === index ? { ...group, ...patch } : group,
      ),
    )
  }

  function addGroup() {
    onChange([
      ...groups,
      {
        name: "",
        horas: 0,
        position: groups.length,
        jobs: [],
      },
    ])
  }

  function removeGroup(index: number) {
    const group = groups[index]
    if (group?.jobs.length && !window.confirm("Este grupo contiene jobs. ¿Eliminarlo?")) {
      return
    }
    onChange(normalizePositions(groups.filter((_, groupIndex) => groupIndex !== index)))
  }

  function moveGroup(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= groups.length) {
      return
    }

    const reordered = [...groups]
    const [group] = reordered.splice(index, 1)
    if (!group) {
      return
    }
    reordered.splice(targetIndex, 0, group)
    onChange(normalizePositions(reordered))
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.length === 0 ? (
        <div className="rounded-md border border-dashed px-4 py-10 text-center">
          <p className="text-sm font-medium">Aún no hay grupos de trabajo</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea un grupo para comenzar a añadir jobs y costos.
          </p>
        </div>
      ) : null}

      {groups.map((group, index) => (
        <Collapsible key={group.id ?? `group-${index}`} defaultOpen>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <FieldGroup className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <Field>
                  <FieldLabel htmlFor={`group-name-${index}`}>Grupo</FieldLabel>
                  <Input
                    id={`group-name-${index}`}
                    value={group.name}
                    onChange={(event) => updateGroup(index, { name: event.target.value })}
                    placeholder="Motor"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`group-hours-${index}`}>Horas</FieldLabel>
                  <Input
                    id={`group-hours-${index}`}
                    type="number"
                    min="0"
                    step="0.25"
                    inputMode="decimal"
                    value={group.horas}
                    onChange={(event) =>
                      updateGroup(index, { horas: toNonNegativeNumber(event.target.value) })
                    }
                  />
                </Field>
              </FieldGroup>

              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => moveGroup(index, -1)}
                  disabled={index === 0}
                  aria-label="Subir grupo"
                  title="Subir grupo"
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => moveGroup(index, 1)}
                  disabled={index === groups.length - 1}
                  aria-label="Bajar grupo"
                  title="Bajar grupo"
                >
                  <ArrowDown />
                </Button>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Mostrar u ocultar jobs"
                    title="Mostrar u ocultar jobs"
                  >
                    <ChevronDown />
                  </Button>
                </CollapsibleTrigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeGroup(index)}
                  aria-label="Eliminar grupo"
                  title="Eliminar grupo"
                >
                  <Trash2 />
                </Button>
              </div>
            </div>

            <CollapsibleContent>
              <TarifaJobsTable
                jobs={group.jobs}
                currency={currency}
                onChange={(jobs) => updateGroup(index, { jobs })}
              />
            </CollapsibleContent>

            <Separator />
          </div>
        </Collapsible>
      ))}

      <Button type="button" variant="outline" onClick={addGroup} className="self-start">
        <Plus data-icon="inline-start" />
        Añadir grupo
      </Button>
    </div>
  )
}

function normalizePositions(groups: TarifaGroupJob[]) {
  return groups.map((group, position) => ({ ...group, position }))
}

function toNonNegativeNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}
