"use client"

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import type { TarifaJob } from "@workspace/backend/types/overhaul"

import { formatMoney } from "./tarifa-summary"

export function TarifaJobsTable({
  jobs,
  currency,
  onChange,
}: {
  jobs: TarifaJob[]
  currency: "USD" | "PEN"
  onChange: (jobs: TarifaJob[]) => void
}) {
  function updateJob(index: number, field: keyof TarifaJob, value: string) {
    onChange(
      jobs.map((job, jobIndex) =>
        jobIndex === index
          ? {
              ...job,
              [field]: field === "name" ? value : toNonNegativeNumber(value),
            }
          : job,
      ),
    )
  }

  function addJob() {
    onChange([
      ...jobs,
      {
        name: "",
        materialAndMo: 0,
        miscelaneos: 0,
        repuestos: 0,
        position: jobs.length,
      },
    ])
  }

  function removeJob(index: number) {
    onChange(normalizePositions(jobs.filter((_, jobIndex) => jobIndex !== index)))
  }

  function moveJob(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= jobs.length) {
      return
    }

    const reordered = [...jobs]
    const [job] = reordered.splice(index, 1)
    if (!job) {
      return
    }
    reordered.splice(targetIndex, 0, job)
    onChange(normalizePositions(reordered))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border">
        <Table className="min-w-225">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-60">Job</TableHead>
              <TableHead className="w-44 text-right">Material + MO</TableHead>
              <TableHead className="w-40 text-right">Misceláneos</TableHead>
              <TableHead className="w-40 text-right">Repuestos</TableHead>
              <TableHead className="w-40 text-right">Subtotal</TableHead>
              <TableHead className="w-30"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                  Este grupo todavía no tiene jobs.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job, index) => (
                <TableRow key={job.id ?? `job-${index}`}>
                  <TableCell>
                    <Input
                      value={job.name}
                      onChange={(event) => updateJob(index, "name", event.target.value)}
                      aria-label={`Nombre del job ${index + 1}`}
                      placeholder="Desmontaje y evaluación"
                    />
                  </TableCell>
                  <MoneyCell
                    label="Material y mano de obra"
                    value={job.materialAndMo}
                    onChange={(value) => updateJob(index, "materialAndMo", value)}
                  />
                  <MoneyCell
                    label="Misceláneos"
                    value={job.miscelaneos}
                    onChange={(value) => updateJob(index, "miscelaneos", value)}
                  />
                  <MoneyCell
                    label="Repuestos"
                    value={job.repuestos}
                    onChange={(value) => updateJob(index, "repuestos", value)}
                  />
                  <TableCell className="text-right font-medium">
                    {formatMoney(
                      job.materialAndMo + job.miscelaneos + job.repuestos,
                      currency,
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveJob(index, -1)}
                        disabled={index === 0}
                        aria-label="Subir job"
                        title="Subir job"
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveJob(index, 1)}
                        disabled={index === jobs.length - 1}
                        aria-label="Bajar job"
                        title="Bajar job"
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeJob(index)}
                        aria-label="Eliminar job"
                        title="Eliminar job"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addJob}>
        <Plus data-icon="inline-start" />
        Añadir job
      </Button>
    </div>
  )
}

function MoneyCell({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: string) => void
}) {
  return (
    <TableCell>
      <Input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="text-right"
      />
    </TableCell>
  )
}

function toNonNegativeNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function normalizePositions(jobs: TarifaJob[]) {
  return jobs.map((job, position) => ({ ...job, position }))
}
