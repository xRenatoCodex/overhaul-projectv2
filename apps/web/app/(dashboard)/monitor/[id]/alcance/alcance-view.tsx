import { Check } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import type {
  AlcanceSystem,
  ComponentState,
} from "@workspace/backend/types/overhaul"

import { MarkdownCommentViewDialog } from "./markdown-comment-view-dialog"

const componentStates: { value: ComponentState; label: string }[] = [
  { value: "Nuevo", label: "Nuevo" },
  { value: "Reman", label: "Reman" },
  { value: "RGeneral", label: "Rep. Gral" },
  { value: "Resellado", label: "Resellado" },
  { value: "Reutilizar", label: "Reutilizar" },
  { value: "Cliente", label: "Cliente" },
]

export function AlcanceView({ systems }: { systems: AlcanceSystem[] }) {
  if (systems.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-10 text-center">
        <p className="text-sm font-medium">Sin sistemas definidos</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-24">
      {systems.map((system, systemIndex) => (
        <div key={systemIndex} className="space-y-4">
          <h3 className="max-w-sm font-medium">{system.name}</h3>

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
                </tr>
              </thead>
              <tbody>
                {system.components.map((component, componentIndex) => (
                  <tr key={componentIndex} className="border-b last:border-b-0">
                    <td className="p-2 align-top">
                      <span className="block px-2.5 py-1.5">{component.name}</span>
                    </td>
                    {componentStates.map((option) => {
                      const isSelected = component.state === option.value

                      return (
                        <td key={option.value} className="p-1 text-center align-center">
                          <div
                            aria-label={`Estado ${option.label}`}
                            className={cn(
                              "mx-auto flex size-8 items-center justify-center rounded-md border",
                              isSelected
                                ? "border-emerald-600 bg-emerald-100 text-emerald-700"
                                : "border-input bg-transparent text-transparent",
                            )}
                          >
                            <Check className="size-4" />
                          </div>
                        </td>
                      )
                    })}
                    <td className="p-2 align-top">
                      <span className="block px-2.5 py-1.5">{component.taller || "—"}</span>
                    </td>
                    <td className="p-2 align-top">
                      <span className="block px-2.5 py-1.5">{component.atencion || "—"}</span>
                    </td>
                    <td className="p-2 align-top">
                      <MarkdownCommentViewDialog
                        componentName={component.name}
                        value={component.comentarios ?? ""}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
