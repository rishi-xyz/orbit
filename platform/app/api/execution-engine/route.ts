import { NextResponse } from "next/server"
import { executionEngine } from "@/lib/execution-engine"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: string
      algoId?: number
      strategy?: any
    }

    switch (body.action) {
      case "start":
        executionEngine.startMonitoring()
        return NextResponse.json({
          message: "Execution engine started",
          status: executionEngine.getStatus()
        })

      case "stop":
        executionEngine.stopMonitoring()
        return NextResponse.json({
          message: "Execution engine stopped",
          status: executionEngine.getStatus()
        })

      case "add":
        if (!body.strategy || !body.algoId) {
          return NextResponse.json({ error: "Missing strategy or algoId" }, { status: 400 })
        }
        
        executionEngine.addStrategy({
          ...body.strategy,
          algoId: body.algoId
        })
        
        return NextResponse.json({
          message: "Strategy added to monitoring",
          status: executionEngine.getStatus()
        })

      case "remove":
        if (!body.algoId) {
          return NextResponse.json({ error: "Missing algoId" }, { status: 400 })
        }
        
        executionEngine.removeStrategy(body.algoId)
        
        return NextResponse.json({
          message: "Strategy removed from monitoring",
          status: executionEngine.getStatus()
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Execution engine operation failed. Details: ${msg}` },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      status: executionEngine.getStatus()
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to get execution engine status. Details: ${msg}` },
      { status: 500 }
    )
  }
}