"use client"

import * as React from "react"
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
} from "reactflow"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export type StrategyNodeType =
  | "trigger"
  | "condition"
  | "buy"
  | "sell"
  | "swap"
  | "delay"

export type StrategyNodeData = {
  label: string
  params: Record<string, unknown>
}

export type StrategyFlowState = {
  nodes: Array<Node<StrategyNodeData>>
  edges: Array<Edge>
}

type PaletteItem = {
  type: StrategyNodeType
  label: string
  defaults: Record<string, unknown>
}

const PALETTE: PaletteItem[] = [
  {
    type: "trigger",
    label: "Trigger",
    defaults: { source: "coingecko", symbol: "XLM", intervalSec: 30 },
  },
  {
    type: "condition",
    label: "Condition",
    defaults: { field: "price", operator: ">", value: 0.1 },
  },
  {
    type: "buy",
    label: "Buy",
    defaults: { asset: "XLM", amount: 10, denom: "USDC" },
  },
  {
    type: "sell",
    label: "Sell",
    defaults: { asset: "XLM", amount: 10, denom: "USDC" },
  },
  {
    type: "swap",
    label: "Swap",
    defaults: { from: "USDC", to: "XLM", amount: 10 },
  },
  {
    type: "delay",
    label: "Delay",
    defaults: { seconds: 60 },
  },
]

function slug(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}`
}

function parseNumber(value: string) {
  const n = Number(value)
  return Number.isFinite(n) ? n : value
}

function NodeInspector({
  selected,
  onChange,
}: {
  selected: Node<StrategyNodeData> | null
  onChange: (next: Node<StrategyNodeData>) => void
}) {
  if (!selected) {
    return (
      <div className="text-muted-foreground text-sm">
        Select a node to edit its parameters.
      </div>
    )
  }

  const entries = Object.entries(selected.data.params ?? {})

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-sm font-medium">{selected.data.label}</div>
        <div className="text-muted-foreground text-xs">{selected.type}</div>
      </div>

      <div className="grid gap-3">
        {entries.length === 0 ? (
          <div className="text-muted-foreground text-sm">No params.</div>
        ) : (
          entries.map(([key, value]) => (
            <div key={key} className="grid gap-1.5">
              <Label className="text-xs" htmlFor={`param-${key}`}>
                {key}
              </Label>
              <Input
                id={`param-${key}`}
                value={String(value ?? "")}
                onChange={(e) => {
                  const next = {
                    ...selected,
                    data: {
                      ...selected.data,
                      params: {
                        ...selected.data.params,
                        [key]: parseNumber(e.target.value),
                      },
                    },
                  }
                  onChange(next)
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function FlowInner({
  value,
  onChange,
  className,
}: {
  value: StrategyFlowState
  onChange: (next: StrategyFlowState) => void
  className?: string
}) {
  const [nodes, setNodes] = React.useState<Array<Node<StrategyNodeData>>>(
    value.nodes
  )
  const [edges, setEdges] = React.useState<Array<Edge>>(value.edges)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const rf = useReactFlow()
  const viewport = useViewport()

  React.useEffect(() => {
    onChange({ nodes, edges })
  }, [nodes, edges, onChange])

  const selected = React.useMemo(() => {
    if (!selectedId) return null
    return nodes.find((n) => n.id === selectedId) ?? null
  }, [nodes, selectedId])

  const onNodesChange = React.useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  )
  const onEdgesChange = React.useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )
  const onConnect: OnConnect = React.useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  )

  const onDragStart = (event: React.DragEvent, item: PaletteItem) => {
    event.dataTransfer.setData("application/orbit-node", JSON.stringify(item))
    event.dataTransfer.effectAllowed = "move"
  }

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()

    const raw = event.dataTransfer.getData("application/orbit-node")
    if (!raw) return

    const item = JSON.parse(raw) as PaletteItem

    const bounds = wrapperRef.current?.getBoundingClientRect()
    if (!bounds) return

    const position = rf.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    })

    const id = slug(item.type)

    const newNode: Node<StrategyNodeData> = {
      id,
      type: "default",
      position,
      data: {
        label: item.label,
        params: item.defaults,
      },
    }

    setNodes((nds) => nds.concat(newNode))
    setSelectedId(id)
  }

  return (
    <div className={cn("grid gap-4 lg:grid-cols-[260px_1fr_320px]", className)}>
      <div className="rounded-xl border p-3">
        <div className="text-sm font-medium">Nodes</div>
        <div className="text-muted-foreground mt-1 text-xs">
          Drag onto canvas
        </div>
        <Separator className="my-3" />
        <div className="grid gap-2">
          {PALETTE.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              className="hover:bg-accent flex cursor-grab items-center justify-between rounded-md border px-3 py-2 active:cursor-grabbing"
            >
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-muted-foreground text-xs">{item.type}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={wrapperRef}
        className="rounded-xl border"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <div className="h-[560px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(
              _event: React.MouseEvent,
              n: Node<StrategyNodeData>
            ) => setSelectedId(n.id)}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
        <div className="text-muted-foreground flex items-center justify-between border-t px-3 py-2 text-xs">
          <div>Zoom: {(viewport.zoom * 100).toFixed(0)}%</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setNodes([])
              setEdges([])
              setSelectedId(null)
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="rounded-xl border p-3">
        <div className="text-sm font-medium">Inspector</div>
        <div className="text-muted-foreground mt-1 text-xs">
          Edit selected node params
        </div>
        <Separator className="my-3" />
        <NodeInspector
          selected={selected}
          onChange={(next) => {
            setNodes((nds) => nds.map((n) => (n.id === next.id ? next : n)))
          }}
        />
      </div>
    </div>
  )
}

export function StrategyFlowBuilder({
  value,
  onChange,
  className,
}: {
  value: StrategyFlowState
  onChange: (next: StrategyFlowState) => void
  className?: string
}) {
  return (
    <ReactFlowProvider>
      <FlowInner value={value} onChange={onChange} className={className} />
    </ReactFlowProvider>
  )
}
