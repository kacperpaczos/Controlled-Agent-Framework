"use client"

import ReactFlow, { Node, Edge } from "reactflow"
import "reactflow/dist/style.css"
import type { ThoughtStep } from "@liberos/caf-shared"

function thoughtToNodes(thoughts: ThoughtStep[]): Node[] {
  return thoughts.map((t, i) => ({
    id: t.id,
    type: "default",
    data: { label: t.content.length > 60 ? t.content.slice(0, 60) + "…" : t.content },
    position: { x: 250, y: i * 80 },
  }))
}

function thoughtToEdges(thoughts: ThoughtStep[]): Edge[] {
  const edges: Edge[] = []
  thoughts.forEach((t) => {
    t.children.forEach((childId) => {
      edges.push({ id: `${t.id}-${childId}`, source: t.id, target: childId })
    })
  })
  return edges
}

export function ThoughtChain({ thoughts }: { thoughts: ThoughtStep[] }) {
  const nodes = thoughtToNodes(thoughts)
  const edges = thoughtToEdges(thoughts)

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded border border-gray-700 bg-gray-800/50 text-gray-500">
        Brak danych. Uruchom agenta i połącz Sentinel z WebSocket.
      </div>
    )
  }

  return (
    <div className="h-full w-full rounded border border-gray-700">
      <ReactFlow nodes={nodes} edges={edges} fitView />
    </div>
  )
}
