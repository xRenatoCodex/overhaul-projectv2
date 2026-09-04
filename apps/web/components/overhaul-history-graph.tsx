"use client"

import { useState } from "react"
import { GitBranch, History } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

import { OverhaulHistoryFlowGraph } from "./overhaul-history-flow-graph"



export function OverhaulHistoryDialog({
  overhaulId,
  triggerLabel = "Historial",
  triggerVariant = "outline",
  compact = false,
}: {
  overhaulId: string
  triggerLabel?: string
  triggerVariant?: "outline" | "ghost" | "secondary"
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={compact ? "icon-sm" : "sm"}
          title="Ver historial de versiones"
          aria-label="Ver historial de versiones"
        >
          <History />
          {compact ? null : triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] gap-6 overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="size-4" />
            Historial de versiones
          </DialogTitle>
          <DialogDescription>
            Visualiza el flujo de cambios en cada etapa. Pasa el cursor sobre
            los nodos para ver detalles del autor, fechas y estado.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          <OverhaulHistoryFlowGraph overhaulId={overhaulId} enabled={open} />
        </div>
      </DialogContent>
    </Dialog>
  )
}


