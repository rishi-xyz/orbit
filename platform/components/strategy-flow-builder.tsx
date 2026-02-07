"use client"

import * as React from "react"
import { z } from "zod"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  nodeType: StrategyNodeType
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

const NODE_TYPES = {} as const
const EDGE_TYPES = {} as const

function slug(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}`
}

function parseNumber(value: string) {
  const n = Number(value)
  return Number.isFinite(n) ? n : value
}

const CONDITION_OPERATOR_OPTIONS = [">", ">=", "<", "<=", "==", "!="] as const
const CONDITION_FIELD_OPTIONS = ["price", "volume"] as const
const TRIGGER_SOURCE_OPTIONS = ["coingecko"] as const

const PARAM_SCHEMAS: Record<StrategyNodeType, z.ZodTypeAny> = {
  trigger: z.object({
    source: z.enum(TRIGGER_SOURCE_OPTIONS),
    symbol: z.string().min(1),
    intervalSec: z.coerce.number().int().positive(),
  }),
  condition: z.object({
    field: z.enum(CONDITION_FIELD_OPTIONS),
    operator: z.enum(CONDITION_OPERATOR_OPTIONS),
    value: z.coerce.number(),
  }),
  buy: z.object({
    asset: z.string().min(1),
    amount: z.coerce.number().positive(),
    denom: z.string().min(1),
  }),
  sell: z.object({
    asset: z.string().min(1),
    amount: z.coerce.number().positive(),
    denom: z.string().min(1),
  }),
  swap: z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    amount: z.coerce.number().positive(),
  }),
  delay: z.object({
    seconds: z.coerce.number().int().positive(),
  }),
}

function validateParams(nodeType: StrategyNodeType, params: Record<string, unknown>) {
  const schema = PARAM_SCHEMAS[nodeType]
  const parsed = schema.safeParse(params)

  if (parsed.success) {
    return { ok: true as const, params: parsed.data as Record<string, unknown>, errors: {} }
  }

  const errors: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "")
    if (key) errors[key] = issue.message
  }

  return { ok: false as const, params, errors }
}

function NodeInspector({
  selected,
  onChange,
}: {
  selected: Node<StrategyNodeData> | null
  onChange: (next: Node<StrategyNodeData>) => void
}) {
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    setErrors({})
  }, [selected?.id])

  if (!selected) {
    return (
      <div className="text-muted-foreground text-sm">
        Select a node to edit its parameters.
      </div>
    )
  }

  const entries = Object.entries(selected.data.params ?? {})

  const updateParam = (key: string, rawValue: unknown) => {
    const nextParams = {
      ...(selected.data.params ?? {}),
      [key]: rawValue,
    }

    const validation = validateParams(selected.data.nodeType, nextParams)
    setErrors(validation.errors)

    const next = {
      ...selected,
      data: {
        ...selected.data,
        params: validation.params,
      },
    }
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-sm font-medium">{selected.data.label}</div>
        <div className="text-muted-foreground text-xs">{selected.data.nodeType}</div>
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
              {selected.data.nodeType === "condition" && key === "operator" ? (
                <Select
                  value={String(value ?? "")}
                  onValueChange={(v) => updateParam(key, v)}
                >
                  <SelectTrigger id={`param-${key}`}>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPERATOR_OPTIONS.map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : selected.data.nodeType === "condition" && key === "field" ? (
                <Select
                  value={String(value ?? "")}
                  onValueChange={(v) => updateParam(key, v)}
                >
                  <SelectTrigger id={`param-${key}`}>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_FIELD_OPTIONS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : selected.data.nodeType === "trigger" && key === "source" ? (
                <Select
                  value={String(value ?? "")}
                  onValueChange={(v) => updateParam(key, v)}
                >
                  <SelectTrigger id={`param-${key}`}>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_SOURCE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`param-${key}`}
                  value={String(value ?? "")}
                  onChange={(e) => updateParam(key, parseNumber(e.target.value))}
                />
              )}

              {errors[key] ? (
                <p className="text-destructive text-xs">{errors[key]}</p>
              ) : null}
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

  const nodeTypes = React.useMemo(() => NODE_TYPES, [])
  const edgeTypes = React.useMemo(() => EDGE_TYPES, [])

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
        nodeType: item.type,
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
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
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
