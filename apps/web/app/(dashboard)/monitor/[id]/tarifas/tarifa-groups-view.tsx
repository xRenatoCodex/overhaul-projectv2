import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import type { TarifaGroupJob } from "@workspace/backend/types/overhaul"
import { formatMoney } from "@/app/(dashboard)/overhaul/[id]/tarifas/components/tarifa-summary";


export function TarifaGroupsView({
  groups,
  currency,
}: {
  groups: TarifaGroupJob[]
  currency: "USD" | "PEN"
}) {
  if (groups.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-10 text-center">
        <p className="text-sm font-medium">Aún no hay grupos de trabajo</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      {groups.map((group, groupIndex) => (
        <div key={group.id ?? `group-${groupIndex}`} className="flex flex-col gap-3">
          <h3 className="font-medium">
            {group.name} · {group.horas} h
          </h3>

          <div className="rounded-md border">
            <Table className="min-w-225">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="min-w-60">Job</TableHead>
                  <TableHead className="w-44 text-right">Material + MO</TableHead>
                  <TableHead className="w-40 text-right">Misceláneos</TableHead>
                  <TableHead className="w-40 text-right">Repuestos</TableHead>
                  <TableHead className="w-40 text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                      Este grupo no tiene jobs.
                    </TableCell>
                  </TableRow>
                ) : (
                  group.jobs.map((job, jobIndex) => (
                    <TableRow key={job.id ?? `job-${jobIndex}`}>
                      <TableCell>{job.name}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(job.materialAndMo, currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(job.miscelaneos, currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(job.repuestos, currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(
                          job.materialAndMo + job.miscelaneos + job.repuestos,
                          currency,
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}
