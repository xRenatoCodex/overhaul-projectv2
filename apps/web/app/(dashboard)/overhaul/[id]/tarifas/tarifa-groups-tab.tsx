"use client"

import { AlertCircle } from "lucide-react"
import { ChevronDown, ChevronRight } from "lucide-react"

import type { TarifaGroupJob } from "@workspace/backend/types/overhaul"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

type ParsedGroups = Omit<TarifaGroupJob, "id">[]

type Props = {
  groups: ParsedGroups
  expandedGroups: Set<number>
  warnings: string[]
  onToggleGroup: (index: number) => void
  onGroupNameChange: (index: number, name: string) => void
  onGroupHorasChange: (index: number, value: string) => void
  onJobNameChange: (gi: number, ji: number, name: string) => void
  onJobFieldChange: (
    gi: number,
    ji: number,
    field: "materialAndMo" | "miscelaneos" | "repuestos",
    value: string,
  ) => void
}

export function TarifaGroupsTab({
  groups,
  expandedGroups,
  warnings,
  onToggleGroup,
  onGroupNameChange,
  onGroupHorasChange,
  onJobNameChange,
  onJobFieldChange,
}: Props) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No se detectaron grupos en la hoja &quot;Resumen&quot;.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, gi) => {
        const isExpanded = expandedGroups.has(gi)
        return (
          <div key={gi} className="overflow-hidden rounded-lg border bg-background">
            {/* Group header row */}
            <div className="flex items-center gap-3 bg-muted/40 px-4 py-2.5">
              <button
                type="button"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => onToggleGroup(gi)}
                aria-label={isExpanded ? "Contraer" : "Expandir"}
              >
                {isExpanded ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
              <Input
                value={group.name}
                onChange={(e) => onGroupNameChange(gi, e.target.value)}
                className="h-8 flex-1 bg-background text-sm font-medium"
                placeholder="Nombre del grupo"
              />
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Horas</span>
                <Input
                  type="number"
                  min="0"
                  step="0.25"
                  value={group.horas}
                  onChange={(e) => onGroupHorasChange(gi, e.target.value)}
                  className="h-8 w-28 bg-background text-right text-sm"
                />
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {group.jobs.length} jobs
              </span>
            </div>

            {/* Jobs table */}
            {isExpanded && group.jobs.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="w-full pl-12">Nombre del job</TableHead>
                    <TableHead className="w-44 text-right">Mat. y M.O. (USD)</TableHead>
                    <TableHead className="w-44 text-right">Misceláneos (USD)</TableHead>
                    <TableHead className="w-44 text-right">Repuestos (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.jobs.map((job, ji) => (
                    <TableRow key={ji} className="hover:bg-muted/10">
                      <TableCell className="pl-12">
                        <Input
                          value={job.name}
                          onChange={(e) => onJobNameChange(gi, ji, e.target.value)}
                          className="h-7 text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={job.materialAndMo}
                          onChange={(e) => onJobFieldChange(gi, ji, "materialAndMo", e.target.value)}
                          className="h-7 w-full text-right text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={job.miscelaneos}
                          onChange={(e) => onJobFieldChange(gi, ji, "miscelaneos", e.target.value)}
                          className="h-7 w-full text-right text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={job.repuestos}
                          onChange={(e) => onJobFieldChange(gi, ji, "repuestos", e.target.value)}
                          className="h-7 w-full text-right text-sm"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )
      })}

      {warnings.length > 0 && (
        <Alert className="mt-5 text-sm">
          <AlertCircle className="size-4" />
          <AlertTitle>Advertencias del parser</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 space-y-0.5 text-xs">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
