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
      userAddress?: string
    }

    if (!body?.userAddress) {
      return NextResponse.json({ error: "Missing required field: userAddress" }, { status: 400 })
    }

    const server = getSorobanServer()

    let source
    try {
      source = await server.getAccount(body.userAddress)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      return NextResponse.json(
        {
          error:
            `Could not load Stellar account ${body.userAddress}. ` +
            `Make sure your wallet is funded/activated on the selected network. Details: ${msg}`,
        },
        { status: 400 }
      )
    }

    // Get vault token contract
    let vaultTokenContract: string
    try {
      vaultTokenContract = String(
        await simulateContractCall<any>(
          server,
          source,
          CONTRACT_IDS.vault,
          "token",
          []
        )
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      const lowered = msg.toLowerCase()
      const likelyUninitialized =
        lowered.includes("unreachablecodereached") ||
        lowered.includes("token not set") ||
        lowered.includes("owner not set")
      return NextResponse.json(
        {
          error: likelyUninitialized
            ? "Vault contract is not initialized on this network."
            : `Could not read vault token configuration. Details: ${msg}`,
          status: likelyUninitialized ? "vault_not_initialized" : "error",
        },
        { status: likelyUninitialized ? 400 : 500 }
      )
    }

    // Check token balance and trustline status
    let balance: bigint = BigInt(0)
    let hasTrustline: boolean = false
    let trustlineError: string | null = null

    try {
      const bal = await simulateContractCall<any>(
        server,
        source,
        vaultTokenContract,
        "balance",
        [new Address(body.userAddress).toScVal()]
      )
      
      balance = typeof bal === "bigint" ? bal : typeof bal === "number" ? BigInt(bal) : BigInt(String(bal))
      hasTrustline = true
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      
      // Check if this is a trustline error
      if (msg.includes("trustline entry is missing") || 
          msg.includes("Error(Contract, #13)")) {
        trustlineError = "Token trustline not established. You need to approve this token contract first."
        hasTrustline = false
      } else {
        trustlineError = `Could not check token balance: ${msg}`
      }
    }

    // Prepare trustline setup transaction if needed
    let trustlineXdr: string | null = null
    if (!hasTrustline && trustlineError?.includes("trustline entry is missing")) {
      try {
        // Create transaction to establish trustline
        const tokenContract = new Contract(vaultTokenContract)
        
        const tx = new TransactionBuilder(source, {
          fee: "100000",
          networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
        })
          .addOperation(tokenContract.call("approve", 
            new Address(body.userAddress).toScVal(),  // spender
            nativeToScVal(BigInt("18446744073709551615"), { type: "u128" })  // max u128 for unlimited approval
          ))
          .setTimeout(60)
          .build()

        const prepared = await server.prepareTransaction(tx)
        trustlineXdr = prepared.toXDR()
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error"
        trustlineError = `Failed to prepare trustline setup: ${msg}`
      }
    }

    return NextResponse.json({
      userAddress: body.userAddress,
      tokenContract: vaultTokenContract,
      hasTrustline,
      balance: balance.toString(),
      trustlineError,
      trustlineXdr,
      canInvest: hasTrustline && balance > BigInt(0),
      message: hasTrustline 
        ? `Token access established. Balance: ${balance.toString()}`
        : trustlineError || "Token access check failed"
    })

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Token access check failed. Details: ${msg}` },
      { status: 500 }
    )
  }
}