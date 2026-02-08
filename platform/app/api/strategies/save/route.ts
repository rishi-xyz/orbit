import { NextResponse } from "next/server"
import { executionEngine } from "@/lib/execution-engine"

interface StrategyNode {
  id: string
  type: string
  data: {
    label: string
    nodeType: string
    params: Record<string, unknown>
  }
}

interface StrategyEdge {
  id: string
  source: string
  target: string
}

interface SaveRequest {
  name: string
  description?: string
  nodes: StrategyNode[]
  edges: StrategyEdge[]
}

// Simple in-memory storage for demo (in production, use database)
const strategies = new Map<string, SaveRequest & { id: string; createdAt: Date }>()

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SaveRequest
    
    if (!body.name || !body.nodes || !body.edges) {
      return NextResponse.json({ error: "Missing required fields: name, nodes, edges" }, { status: 400 })
    }

    // Generate unique ID
    const id = `strategy_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
    
    // Store strategy
    strategies.set(id, {
      ...body,
      id,
      createdAt: new Date()
    })

    // Convert flow-builder format to execution engine format
    const executionStrategy = convertFlowToExecutionFormat(body)
    
    if (executionStrategy) {
      // Add to execution engine for monitoring
      executionEngine.addStrategy(executionStrategy)
      
      console.log(`🚀 Strategy "${body.name}" saved and deployed to execution engine`)
      console.log(`📊 Strategy ID: ${id}`)
      console.log(`🔧 Execution format:`, executionStrategy)
      
      return NextResponse.json({
        success: true,
        strategyId: id,
        message: "Strategy saved and deployed successfully",
        executionStatus: executionEngine.getStatus()
      })
    } else {
      return NextResponse.json({
        success: true,
        strategyId: id,
        message: "Strategy saved but not deployed (invalid format)",
        warning: "Strategy structure is incomplete for execution"
      })
    }
    
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to save strategy. Details: ${msg}` },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const allStrategies = Array.from(strategies.values())
    
    return NextResponse.json({
      strategies: allStrategies,
      count: allStrategies.length
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to fetch strategies. Details: ${msg}` },
      { status: 500 }
    )
  }
}

/**
 * Convert flow-builder node format to execution engine format
 */
function convertFlowToExecutionFormat(flow: SaveRequest) {
  try {
    // Find trigger node
    const triggerNode = flow.nodes.find(node => node.data.nodeType === "trigger")
    if (!triggerNode) {
      console.warn("No trigger node found in strategy")
      return null
    }

    // Find condition nodes
    const conditionNodes = flow.nodes.filter(node => node.data.nodeType === "condition")
    
    // Find action nodes (buy/sell)
    const actionNodes = flow.nodes.filter(node => 
      node.data.nodeType === "buy" || node.data.nodeType === "sell"
    )

    if (actionNodes.length === 0) {
      console.warn("No action nodes found in strategy")
      return null
    }

    // Convert trigger to execution format
    const triggerParams = triggerNode.data.params as any
    const conditions = conditionNodes.map(node => {
      const params = node.data.params as any
      return {
        type: 'price' as const,
        parameter: triggerParams.symbol || 'XLM',
        operator: params.operator || '>',
        value: params.value || 0
      }
    })

    // Convert actions to execution format
    const actions = actionNodes.map(node => {
      const params = node.data.params as any
      return {
        type: node.data.nodeType as 'buy' | 'sell',
        asset: params.asset || 'XLM',
        amount: String(params.amount || 0),
        recipient: undefined // Use vault default
      }
    })

    return {
      algoId: parseInt(flow.name.replace(/\D/g, '')) || Date.now() % 1000, // Generate algo ID from name or random
      creatorAddress: "GBOQA7EK4NYZNQU2OQVTZ4VBOW6ZTHO4IICW5KREIHGORBJASQDHILBR", // Backend executor
      vaultAddress: process.env.NEXT_PUBLIC_VAULT_CONTRACT_ID || "CCDLJL4C7MLQDMN4CFXEF64MD275QUORCVX6ZQQJEHMKTZKRLP5IGE2B",
      conditions,
      actions,
      active: true
    }
  } catch (error) {
    console.error("Error converting strategy format:", error)
    return null
  }
}
