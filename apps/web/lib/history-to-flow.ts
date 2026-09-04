import type { Node, Edge } from "@xyflow/react"
import type {
  OverhaulHistory,
  OverhaulHistoryEntry,
  OverhaulStage,
} from "@workspace/backend/types/overhaul"

const STAGE_ORDER: OverhaulStage[] = [
  "necesidad",
  "alcance",
  "tarifas",
  "propuesta",
  "planificacion",
]

const STAGE_COLORS: Record<
  OverhaulStage,
  { bg: string; border: string; label: string }
> = {
  necesidad: {
    bg: "bg-sky-50",
    border: "border-sky-500",
    label: "Necesidad",
  },
  alcance: {
    bg: "bg-violet-50",
    border: "border-violet-500",
    label: "Alcance",
  },
  tarifas: {
    bg: "bg-amber-50",
    border: "border-amber-500",
    label: "Tarifas",
  },
  propuesta: {
    bg: "bg-emerald-50",
    border: "border-emerald-500",
    label: "Propuesta",
  },
  planificacion: {
    bg: "bg-rose-50",
    border: "border-rose-500",
    label: "Planificación",
  },
}

export type HistoryNodeData = {
  stage: OverhaulStage
  version: number
  isCompleted: boolean
  author: string | null
  createdAt: string
  updatedAt: string
  entryId: string
}

export function historyToFlow(history: OverhaulHistory): {
  nodes: Node<HistoryNodeData>[]
  edges: Edge[]
} {
  const nodes: Node<HistoryNodeData>[] = []
  const edges: Edge[] = []

  const stageIndexMap = new Map<OverhaulStage, OverhaulHistoryEntry[]>()

  for (const stage of STAGE_ORDER) {
    stageIndexMap.set(
      stage,
      history.entries.filter((e) => e.stage === stage),
    )
  }

  // Enrich entries: if a version N exists within same stage, all previous versions should be marked as completed
  const enrichedEntries: OverhaulHistoryEntry[] = []
  stageIndexMap.forEach((entries) => {
    const maxVersionInStage = Math.max(...entries.map((e) => e.version))
    entries.forEach((entry) => {
      // Entry is completed if: DB says completed OR there's a newer version in same stage
      const isCompletedEnriched = entry.isCompleted || entry.version < maxVersionInStage
      enrichedEntries.push({
        ...entry,
        isCompleted: isCompletedEnriched,
      })
    })
  })

  const NODE_WIDTH = 160
  const NODE_HEIGHT = 110
  const STAGE_GAP_X = 250
  const VERSION_GAP_Y = 140

  let maxVersionsPerStage = 0
  stageIndexMap.forEach((entries) => {
    maxVersionsPerStage = Math.max(maxVersionsPerStage, entries.length)
  })

  const START_X = 50
  const START_Y = 50

  const nodeIdMap = new Map<string, string>()

  STAGE_ORDER.forEach((stage, stageIndex) => {
    const entries = stageIndexMap.get(stage) || []

    entries.forEach((entry, versionIndex) => {
      const x = START_X + stageIndex * STAGE_GAP_X
      const y = START_Y + versionIndex * VERSION_GAP_Y
      const nodeId = `${stage}-${entry.version}`

      nodeIdMap.set(entry.id, nodeId)

      const stageConfig = STAGE_COLORS[stage]

      // Find enriched entry for this stage/version
      const enrichedEntry = enrichedEntries.find(
        (e) => e.stage === stage && e.version === entry.version,
      )

      nodes.push({
        id: nodeId,
        data: {
          stage,
          version: entry.version,
          isCompleted: enrichedEntry?.isCompleted ?? entry.isCompleted,
          author: entry.author,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          entryId: entry.id,
        },
        position: { x, y },
        type: "historyEntry",
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        style: {
          padding: "8px",
          borderRadius: "8px",
          border: `2px solid ${getBorderColor(stage)}`,
          backgroundColor: getBgColor(stage),
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "12px",
          fontWeight: "500",
        },
      })
    })
  })

  const sortedEntries = [...history.entries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  const entriesByStage: Record<OverhaulStage, OverhaulHistoryEntry[]> = {
    necesidad: [],
    alcance: [],
    tarifas: [],
    propuesta: [],
    planificacion: [],
  }

  for (const entry of sortedEntries) {
    entriesByStage[entry.stage].push(entry)
  }

  // Connect consecutive versions within the same stage
  for (const stage of STAGE_ORDER) {
    const entries = entriesByStage[stage]
    for (let i = 0; i < entries.length - 1; i++) {
      const current = entries[i]
      const next = entries[i + 1]
      if (!current || !next) continue

      const currentNodeId = nodeIdMap.get(current.id)
      const nextNodeId = nodeIdMap.get(next.id)

      if (currentNodeId && nextNodeId) {
        edges.push({
          id: `edge-intra-${stage}-${i}`,
          source: currentNodeId,
          sourceHandle: "bottom",
          target: nextNodeId,
          targetHandle: "top",
          type: "smoothstep",
          animated: false,
          style: {
            stroke: getEdgeColor(stage),
            strokeWidth: 2,
          },
        })
      }
    }
  }

  // Connect between stages
  for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
    const currentStage = STAGE_ORDER[i]
    const nextStage = STAGE_ORDER[i + 1]

    if (!currentStage || !nextStage) continue

    const currentStageEntries = entriesByStage[currentStage]
    const nextStageEntries = entriesByStage[nextStage]

    if (currentStageEntries.length === 0 || nextStageEntries.length === 0) continue

    const lastCurrentEntry = currentStageEntries.at(-1)
    const firstNextEntry = nextStageEntries.at(0)

    if (!lastCurrentEntry || !firstNextEntry) continue

    const lastCurrentNodeId = nodeIdMap.get(lastCurrentEntry.id)
    const firstNextNodeId = nodeIdMap.get(firstNextEntry.id)

    if (lastCurrentNodeId && firstNextNodeId) {
      edges.push({
        id: `edge-inter-${currentStage}-${nextStage}`,
        source: lastCurrentNodeId,
        sourceHandle: "right",
        target: firstNextNodeId,
        targetHandle: "left",
        type: "smoothstep",
        animated: false,
        style: {
          stroke: getEdgeColor(nextStage),
          strokeWidth: 2.5,
        },
      })
    }
  }

  // Deduplicate nodes by ID to prevent React key warnings
  const uniqueNodesMap = new Map<string, Node<HistoryNodeData>>()
  for (const node of nodes) {
    uniqueNodesMap.set(node.id, node)
  }

  return { nodes: Array.from(uniqueNodesMap.values()), edges }
}

function getBgColor(stage: OverhaulStage): string {
  const colors: Record<OverhaulStage, string> = {
    necesidad: "#f0f9ff",
    alcance: "#faf5ff",
    tarifas: "#fffbeb",
    propuesta: "#f0fdf4",
    planificacion: "#fdf2f8",
  }
  return colors[stage]
}

function getBorderColor(stage: OverhaulStage): string {
  const colors: Record<OverhaulStage, string> = {
    necesidad: "#0ea5e9",
    alcance: "#a855f7",
    tarifas: "#f59e0b",
    propuesta: "#10b981",
    planificacion: "#f43f5e",
  }
  return colors[stage]
}

function getEdgeColor(stage: OverhaulStage): string {
  const colors: Record<OverhaulStage, string> = {
    necesidad: "#0ea5e9",
    alcance: "#a855f7",
    tarifas: "#f59e0b",
    propuesta: "#10b981",
    planificacion: "#f43f5e",
  }
  return colors[stage]
}
