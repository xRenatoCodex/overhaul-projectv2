"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import type {
  OverhaulHistory,
  OverhaulStage,
} from "@workspace/backend/types/overhaul"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import { historyToFlow, type HistoryNodeData } from "@/lib/history-to-flow"
import { HistoryEntryNode } from "./history-entry-node"

const nodeTypes = {
  historyEntry: HistoryEntryNode,
}

const STAGE_COLORS: Record<
  OverhaulStage,
  { bg: string; border: string }
> = {
  necesidad: { bg: "bg-sky-500", border: "border-sky-500" },
  alcance: { bg: "bg-violet-500", border: "border-violet-500" },
  tarifas: { bg: "bg-amber-500", border: "border-amber-500" },
  propuesta: { bg: "bg-emerald-500", border: "border-emerald-500" },
  planificacion: { bg: "bg-rose-500", border: "border-rose-500" },
}

export function OverhaulHistoryFlowGraph({
  overhaulId,
  enabled = true,
}: {
  overhaulId: string
  enabled?: boolean
}) {
  const [history, setHistory] = useState<OverhaulHistory | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const loadHistory = useCallback(
    async (signal: AbortSignal) => {
      setIsLoading(true)
      setError("")

      try {
        const response = await fetch(`/api/overhaul/${overhaulId}/historial`, {
          signal,
          cache: "no-store",
        })
        if (!response.ok) {
          throw new Error("No se pudo cargar el historial.")
        }
        const data = (await response.json()) as OverhaulHistory
        setHistory(data)

        const { nodes: flowNodes, edges: flowEdges } = historyToFlow(data)
        setNodes(flowNodes as any)
        setEdges(flowEdges as any)
      } catch (fetchError) {
        if (signal.aborted) return
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "No se pudo cargar el historial.",
        )
      } finally {
        if (!signal.aborted) {
          setIsLoading(false)
        }
      }
    },
    [overhaulId, setNodes, setEdges],
  )

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()
    void loadHistory(controller.signal)

    return () => controller.abort()
  }, [enabled, loadHistory])

  if (isLoading && !history) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </p>
    )
  }

  const entries = history?.entries ?? []

  if (entries.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Todavía no hay versiones registradas.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.entries(STAGE_COLORS) as Array<[OverhaulStage, { bg: string; border: string }]>).map(
          ([stage, colors]) => (
            <span
              key={stage}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className={cn("size-2 rounded-full border", colors.bg, colors.border)} />
              {getLabelForStage(stage)}
            </span>
          ),
        )}
      </div>

      <div className="border rounded-lg overflow-hidden bg-background" style={{ height: "500px" }}>
        <style>{`
          .react-flow__handle {
            width: 8px !important;
            height: 8px !important;
            background-color: transparent !important;
            border: none !important;
          }
        `}</style>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  )
}

function getLabelForStage(stage: OverhaulStage): string {
  const labels: Record<OverhaulStage, string> = {
    necesidad: "Necesidad",
    alcance: "Alcance",
    tarifas: "Tarifas",
    propuesta: "Propuesta",
    planificacion: "Planificación",
  }
  return labels[stage]
}
