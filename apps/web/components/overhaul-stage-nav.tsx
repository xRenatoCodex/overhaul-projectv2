"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"

import { cn } from "@workspace/ui/lib/utils"

const stages = [
  { label: "Necesidad", segment: "necesidad" },
  { label: "Alcance", segment: "alcance" },
  { label: "Tarifas", segment: "tarifas" },
  { label: "Propuesta", segment: "propuesta" },
  { label: "Planificacion", segment: "planificacion" },
]

export function OverhaulStageNav() {
  const pathname = usePathname()
  const params = useParams<{ id: string }>()
  const overhaulId = Array.isArray(params.id) ? params.id[0] : params.id

  if (!overhaulId) {
    return null
  }

  return (
    <nav className="mb-6 flex w-full">
      {stages.map((stage, index) => {
        const href = `/overhaul/${overhaulId}/${stage.segment}`
        const isActive = pathname === href
        const isFirst = index === 0

        return (
          <Link
            key={stage.segment}
            href={href}
            style={{
              clipPath: isFirst
                ? "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)"
                : "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 16px 50%)",
            }}
            className={cn(
              "flex flex-1 items-center gap-2 py-2 pr-6 pl-5 text-sm font-medium transition-colors",
              !isFirst && "-ml-4",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                isActive
                  ? "bg-primary-foreground text-primary"
                  : "bg-background text-foreground",
              )}
            >
              {index + 1}
            </span>
            <span className="truncate">{stage.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
