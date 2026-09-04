"use client"

import { useEffect } from "react"
import type { NodeProps } from "@xyflow/react"
import { Handle, Position, useUpdateNodeInternals } from "@xyflow/react"
import { CheckCircle2, Circle } from "lucide-react"

import type { HistoryNodeData } from "@/lib/history-to-flow"
import { HistoryEntryPopover } from "./history-entry-popover"

const STAGE_LABELS: Record<string, string> = {
  necesidad: "Necesidad",
  alcance: "Alcance",
  tarifas: "Tarifas",
  propuesta: "Propuesta",
  planificacion: "Planificación",
}

export function HistoryEntryNode(props: NodeProps) {
  const data = props.data as HistoryNodeData
  const { selected, id } = props
  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    updateNodeInternals(id)
  }, [id, updateNodeInternals])
  return (
    <>
      <Handle id="top" type="target" position={Position.Top} />
      <Handle id="left" type="target" position={Position.Left} />
      <HistoryEntryPopover data={data}>
        <div
          className={`flex flex-col items-center justify-center gap-2 cursor-pointer transition-all px-3 py-2 ${
            selected ? "ring-2 ring-offset-2 ring-foreground" : ""
          }`}
        >
          <div className="text-sm font-semibold truncate w-full text-center">
            {STAGE_LABELS[data.stage] || data.stage}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            v{data.version}
          </div>
          <div className="flex items-center gap-1">
            {data.isCompleted ? (
              <CheckCircle2 className="size-4 text-green-600" />
            ) : (
              <Circle className="size-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </HistoryEntryPopover>
      <Handle id="bottom" type="source" position={Position.Bottom} />
      <Handle id="right" type="source" position={Position.Right} />
    </>
  )
}
