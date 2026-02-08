import { NextResponse } from "next/server"
import {
  Address,
  Contract,
  TransactionBuilder,
  nativeToScVal,
} from "@stellar/stellar-sdk"

import {
  CONTRACT_IDS,
  SOROBAN_NETWORK_PASSPHRASE,
  getSorobanServer,
} from "@/lib/soroban"

// Demo strategy configurations
const DEMO_STRATEGIES = [
  {
    name: "Moving Average Crossover",
    description: "Safe demo strategy using moving average indicators",
    paramsHash: "sha256:ma_crossover_demo_v1",
    owner: "GBOQA7EK4NYZNQU2OQVTZ4VBOW6ZTHO4IICW5KREIHGORBJASQDHILBR", // Platform demo account
    flow: {
      version: 1,
      nodes: [
        {
          id: "1",
          type: "price_feed",
          position: { x: 100, y: 100 },
          data: { asset: "XLM", source: "stellar" }
        },
        {
          id: "2", 
          type: "moving_average",
          position: { x: 300, y: 100 },
          data: { period: 20, type: "SMA" }
        },
        {
          id: "3",
          type: "condition",
          position: { x: 500, y: 100 },
          data: { operator: ">", threshold: "0.95" }
        },
        {
          id: "4",
          type: "trade",
          position: { x: 700, y: 100 },
          data: { action: "buy", amount: "100" }
        }
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
        { id: "e3", source: "3", target: "4" }
      ]
    }
  },
  {
    name: "DCA Strategy (Safest First)",
    description: "Dollar Cost Averaging strategy - safest demo for beginners",
    paramsHash: "sha256:dca_safe_demo_v1",
    owner: "GBOQA7EK4NYZNQU2OQVTZ4VBOW6ZTHO4IICW5KREIHGORBJASQDHILBR",
    flow: {
      version: 1,
      nodes: [
        {
          id: "1",
          type: "timer",
          position: { x: 100, y: 100 },
          data: { interval: "daily", amount: "50" }
        },
        {
          id: "2",
          type: "price_check",
          position: { x: 300, y: 100 },
          data: { asset: "USDC", max_price: "1.05" }
        },
        {
          id: "3",
          type: "trade",
          position: { x: 500, y: 100 },
          data: { action: "buy", amount: "50" }
        }
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" }
      ]
    }
  }
]

async function simulateContractCall<T>(
  server: any,
  sourceAccount: any,
  contractId: string,
  method: string,
  args: any[]
): Promise<T> {
  const contract = new Contract(contractId)

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100000",
    networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build()

  const sim = await server.simulateTransaction(tx)
  const simAny = sim as any
  if (simAny?.error || simAny?.status === "ERROR") {
    throw new Error(simAny?.error ?? simAny?.message ?? "Simulation failed")
  }

  const retval = simAny?.result?.retval ?? simAny?.retval
  return retval as T
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: string
      strategyId?: string
    }

    const server = getSorobanServer()
    
    // Use platform demo account for creating strategies
    const demoAccount = "GBOQA7EK4NYZNQU2OQVTZ4VBOW6ZTHO4IICW5KREIHGORBJASQDHILBR"
    
    let source
    try {
      source = await server.getAccount(demoAccount)
    } catch (e) {
      return NextResponse.json({
        error: "Demo account not funded. Please fund the demo account first.",
        demoAccount,
        needsFunding: true
      }, { status: 400 })
    }

    if (body.action === "create") {
      const results = []
      
      for (const strategy of DEMO_STRATEGIES) {
        try {
          // Create the strategy
          const contract = new Contract(CONTRACT_IDS.algoRegistry)
          
          const tx = new TransactionBuilder(source, {
            fee: "100000",
            networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
          })
            .addOperation(
              contract.call(
                "create_algo",
                new Address(strategy.owner).toScVal(),
                nativeToScVal(strategy.name, { type: "string" }),
                nativeToScVal(strategy.description, { type: "string" }),
                nativeToScVal(strategy.paramsHash, { type: "string" })
              )
            )
            .setTimeout(60)
            .build()

          const prepared = await server.prepareTransaction(tx)
          
          results.push({
            name: strategy.name,
            description: strategy.description,
            paramsHash: strategy.paramsHash,
            transactionXdr: prepared.toXDR(),
            status: "prepared"
          })
          
        } catch (e) {
          results.push({
            name: strategy.name,
            error: e instanceof Error ? e.message : "Unknown error",
            status: "failed"
          })
        }
      }
      
      return NextResponse.json({
        message: "Demo strategies prepared for deployment",
        strategies: results,
        note: "These need to be signed and submitted by the demo account holder"
      })
    }
    
    if (body.action === "list") {
      // List existing demo strategies
      try {
        const totalAlgos = await simulateContractCall<number>(
          server,
          source,
          CONTRACT_IDS.algoRegistry,
          "total_algos",
          []
        )
        
        const strategies = []
        for (let i = 0; i < Math.min(totalAlgos, 10); i++) {
          try {
            const algo = await simulateContractCall<any>(
              server,
              source,
              CONTRACT_IDS.algoRegistry,
              "get_algo",
              [nativeToScVal(i, { type: "u32" })]
            )
            
            if (algo && (algo.name.includes("Moving Average") || algo.name.includes("DCA"))) {
              strategies.push({
                id: i,
                name: algo.name,
                description: algo.metadata_uri,
                owner: algo.owner,
                active: algo.active,
                paramsHash: algo.paramsHash
              })
            }
          } catch (e) {
            // Skip if algo doesn't exist
          }
        }
        
        return NextResponse.json({
          strategies,
          total: strategies.length
        })
        
      } catch (e) {
        return NextResponse.json({
          error: "Failed to list strategies",
          details: e instanceof Error ? e.message : "Unknown error"
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({
      error: "Invalid action. Use 'create' or 'list'",
      availableActions: ["create", "list"]
    }, { status: 400 })
    
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Demo strategy operation failed. Details: ${msg}` },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const server = getSorobanServer()
    const demoAccount = "GBOQA7EK4NYZNQU2OQVTZ4VBOW6ZTHO4IICW5KREIHGORBJASQDHILBR"
    
    let source
    try {
      source = await server.getAccount(demoAccount)
    } catch (e) {
      return NextResponse.json({
        error: "Demo account not accessible",
        demoAccount,
        strategies: DEMO_STRATEGIES.map(s => ({
          name: s.name,
          description: s.description,
          status: "not_deployed",
          note: "Strategy template ready for deployment"
        }))
      }, { status: 200 })
    }
    
    // Try to get existing strategies
    try {
      const totalAlgos = await simulateContractCall<number>(
        server,
        source,
        CONTRACT_IDS.algoRegistry,
        "total_algos",
        []
      )
      
      const strategies = []
      for (let i = 0; i < Math.min(totalAlgos, 10); i++) {
        try {
          const algo = await simulateContractCall<any>(
            server,
            source,
            CONTRACT_IDS.algoRegistry,
            "get_algo",
            [nativeToScVal(i, { type: "u32" })]
          )
          
          if (algo && (algo.name.includes("Moving Average") || algo.name.includes("DCA") || algo.name.includes("Demo"))) {
            strategies.push({
              id: i,
              name: algo.name,
              description: algo.metadata_uri,
              owner: algo.owner,
              active: algo.active,
              paramsHash: algo.paramsHash
            })
          }
        } catch (e) {
          // Skip if algo doesn't exist
        }
      }
      
      return NextResponse.json({
        strategies,
        total: strategies.length,
        demoAccount,
        note: strategies.length === 0 ? "No demo strategies found. Use POST /create to deploy them." : "Demo strategies available"
      })
      
    } catch (e) {
      return NextResponse.json({
        strategies: DEMO_STRATEGIES.map(s => ({
          name: s.name,
          description: s.description,
          status: "template_ready",
          flow: s.flow
        })),
        demoAccount,
        note: "Strategy templates ready. Use POST /create to deploy."
      })
    }
    
  } catch (e) {
    return NextResponse.json({
      error: "Failed to get demo strategies",
      details: e instanceof Error ? e.message : "Unknown error",
      strategies: DEMO_STRATEGIES.map(s => ({
        name: s.name,
        description: s.description,
        status: "error"
      }))
    }, { status: 500 })
  }
}