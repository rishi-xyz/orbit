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
import { toast } from "sonner"

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
  const [isDeploying, setIsDeploying] = React.useState(false)

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

  const deployStrategy = async () => {
    if (nodes.length === 0) {
      toast.error("Cannot deploy empty strategy", {
        description: "Add at least a trigger and an action node."
      })
      return
    }

    const hasTrigger = nodes.some(node => node.data.nodeType === "trigger")
    const hasAction = nodes.some(node => 
      node.data.nodeType === "buy" || node.data.nodeType === "sell"
    )

    if (!hasTrigger) {
      toast.error("Missing trigger", {
        description: "Add a trigger node to define when the strategy should execute."
      })
      return
    }

    if (!hasAction) {
      toast.error("Missing action", {
        description: "Add at least one buy or sell action node."
      })
      return
    }

    setIsDeploying(true)
    
    try {
      const response = await fetch("/api/strategies/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Strategy_${Date.now()}`,
          description: "Auto-generated strategy from builder",
          nodes,
          edges
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success("Strategy deployed successfully!", {
          description: `Strategy ID: ${result.strategyId}. Monitoring started.`
        })
        
        // Start execution engine if not already running
        await fetch("/api/execution-engine", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "start" })
        })
      } else {
        toast.error("Deployment failed", {
          description: result.error || "Unknown error occurred"
        })
      }
    } catch (error) {
      toast.error("Deployment failed", {
        description: error instanceof Error ? error.message : "Network error"
      })
    } finally {
      setIsDeploying(false)
    }
  }

  const onDragStart = (event: React.DragEvent, item: PaletteItem) => {
    event.dataTransfer.setData("application/orbit-node", JSON.stringify(item))
    event.dataTransfer.effectAllowed = "move"
  }

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const bounds = wrapperRef.current?.getBoundingClientRect()
    if (!bounds) return

    const position = rf.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    })

    const data = event.dataTransfer.getData("application/orbit-node")
    const item = JSON.parse(data) as PaletteItem

    // Handle regular palette items
    if (!('defaults' in item)) {
      console.log("Invalid palette item:", item)
      return
    }

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

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }

  const [nodesCollapsed, setNodesCollapsed] = React.useState(false)
  const [inspectorCollapsed, setInspectorCollapsed] = React.useState(false)

  return (
    <div className={cn("grid gap-4 h-full", className)} style={{ 
      gridTemplateColumns: nodesCollapsed ? '0fr 1fr' : inspectorCollapsed ? '260px 1fr 0fr' : '260px 1fr 320px',
      transition: 'grid-template-columns 0.3s ease-in-out'
    }}>
      <div className={`rounded-xl border p-3 ${nodesCollapsed ? 'hidden' : ''} transition-all duration-300`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Nodes</div>
            <div className="text-muted-foreground mt-1 text-xs">
              Drag onto canvas
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNodesCollapsed(true)}
            className="h-8 w-8 p-0"
          >
            ←
          </Button>
        </div>
        <Separator className="my-3" />
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid gap-2">
            <div className="text-xs font-medium text-muted-foreground">BUILDING BLOCKS</div>
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
      </div>

      {nodesCollapsed && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setNodesCollapsed(false)}
          className="h-8 w-8 p-0 self-start"
        >
          →
        </Button>
      )}

      <div
        ref={wrapperRef}
        className="rounded-xl border flex flex-col"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <div className="flex-1" style={{ minHeight: '600px' }}>
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
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              disabled={isDeploying}
              onClick={deployStrategy}
            >
              {isDeploying ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                  Deploying...
                </>
              ) : (
                <>
                  🚀 Deploy Strategy
                </>
              )}
            </Button>
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
      </div>

      <div className={`rounded-xl border p-3 ${inspectorCollapsed ? 'hidden' : ''} transition-all duration-300`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Inspector</div>
            <div className="text-muted-foreground mt-1 text-xs">
              Edit selected node params
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInspectorCollapsed(true)}
            className="h-8 w-8 p-0"
          >
            →
          </Button>
        </div>
        <Separator className="my-3" />
        <NodeInspector
          selected={selected}
          onChange={(next) => {
            setNodes((nds) => nds.map((n) => (n.id === next.id ? next : n)))
          }}
        />
      </div>

      {inspectorCollapsed && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInspectorCollapsed(false)}
          className="h-8 w-8 p-0 self-start"
        >
          ←
        </Button>
      )}
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
