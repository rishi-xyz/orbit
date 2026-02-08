import { NextResponse } from "next/server"
import {
  Address,
  Contract,
  Operation,
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

    // Check if creator already has a vault
    try {
      const existingVault = await simulateContractCall<any>(
        server,
        source,
        CONTRACT_IDS.algoRegistry,
        "get_creator_vault",
        [new Address(body.creatorAddress).toScVal()]
      )

      if (existingVault) {
        return NextResponse.json({
          creatorAddress: body.creatorAddress,
          vaultAddress: existingVault,
          hasVault: true,
          message: "Creator already has a vault"
        })
      }
    } catch (e) {
      // No existing vault, continue with creation
    }

    // Create a mock transaction for demonstration purposes
    // In a real deployment, this would deploy and use the CreatorVaultFactory contract
    try {
      // For demo purposes, create a transaction that appears to work but gives informative message
      // For demo purposes, create a simple transaction
      const tx = new TransactionBuilder(source, {
        fee: "100000",
        networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
      })
        .addOperation(Operation.manageData({
          name: "creator_vault_demo",
          value: Buffer.from(`creator:${body.creatorAddress}`, 'utf-8')
        }))
        .setTimeout(60)
        .build()

      const prepared = await server.prepareTransaction(tx)
      
      return NextResponse.json({
        vaultAddress: `DEMO_VAULT_${body.creatorAddress.slice(0, 8)}`,
        transactionXdr: prepared.toXDR(),
        isDemo: true,
        message: "Demo creator vault transaction prepared. In production, this would deploy the actual CreatorVaultFactory contract.",
        creatorAddress: body.creatorAddress,
        needsFactoryDeployment: false
      })
      
    } catch (e) {
      return NextResponse.json({
        error: "Creator vault factory not deployed yet. This is a demo environment.",
        needsFactoryDeployment: true,
        creatorAddress: body.creatorAddress,
        message: "In production, deploy the CreatorVaultFactory contract first.",
        isDemo: true
      }, { status: 400 })
    }

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to create creator vault. Details: ${msg}` },
      { status: 500 }
    )
  }
}