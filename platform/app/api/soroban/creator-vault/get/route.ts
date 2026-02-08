import { NextResponse } from "next/server"
import {
  Address,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk"

import {
  CONTRACT_IDS,
  SOROBAN_NETWORK_PASSPHRASE,
  getSorobanServer,
} from "@/lib/soroban"

async function simulateContractCall<T>(
  server: any,
  sourceAccount: any,
  contractId: string,
  method: string,
  args: xdr.ScVal[]
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
  return scValToNative(retval) as T
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      creatorAddress?: string
    }

    if (!body?.creatorAddress) {
      return NextResponse.json({ error: "Missing required field: creatorAddress" }, { status: 400 })
    }

    const server = getSorobanServer()

    let source
    try {
      source = await server.getAccount(body.creatorAddress)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      return NextResponse.json(
        {
          error:
            `Could not load Stellar account ${body.creatorAddress}. ` +
            `Make sure your wallet is funded/activated on the selected network. Details: ${msg}`,
        },
        { status: 400 }
      )
    }

    // Get creator vault information
    let vaultAddress: string | null = null
    let vaultInfo: any = null

    try {
      vaultAddress = await simulateContractCall<any>(
        server,
        source,
        CONTRACT_IDS.algoRegistry,
        "get_creator_vault",
        [new Address(body.creatorAddress).toScVal()]
      )

      if (vaultAddress) {
        // Get vault details
        vaultInfo = await simulateContractCall<any>(
          server,
          source,
          vaultAddress,
          "get_vault_info",
          []
        )
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      
      // Check if the function doesn't exist (contract not updated yet)
      if (msg.includes("get_creator_vault") || msg.includes("MissingValue") || msg.includes("non-existent contract function")) {
        return NextResponse.json({
          creatorAddress: body.creatorAddress,
          hasVault: false,
          vaultAddress: null,
          vaultInfo: null,
          message: "Creator vault functionality not deployed yet. Please deploy updated contracts.",
          needsContractUpdate: true
        })
      }
      
      return NextResponse.json(
        {
          error: `Could not fetch creator vault information. Details: ${msg}`,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      creatorAddress: body.creatorAddress,
      hasVault: !!vaultAddress,
      vaultAddress: vaultAddress,
      vaultInfo: vaultInfo,
      message: vaultAddress ? "Creator vault found" : "Creator does not have a vault"
    })

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to fetch creator vault. Details: ${msg}` },
      { status: 500 }
    )
  }
}