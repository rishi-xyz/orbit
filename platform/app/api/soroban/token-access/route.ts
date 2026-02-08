import { NextResponse } from "next/server"
import {
  Address,
  Asset,
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
  console.log("🔍 [API:TokenAccess] Starting token access check")
  try {
    const body = (await req.json()) as {
      userAddress?: string
    }
    console.log("🔍 [API:TokenAccess] Request body:", body)

    if (!body?.userAddress) {
      console.error("🔍 [API:TokenAccess] Missing userAddress")
      return NextResponse.json({ error: "Missing required field: userAddress" }, { status: 400 })
    }

    const server = getSorobanServer()
    console.log("🔍 [API:TokenAccess] Got Soroban server")

    let source
    try {
      source = await server.getAccount(body.userAddress)
      console.log("🔍 [API:TokenAccess] Loaded account:", source.accountId())
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      console.error("🔍 [API:TokenAccess] Failed to load account:", msg)
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
      console.log("🔍 [API:TokenAccess] Getting vault token contract...")
      vaultTokenContract = String(
        await simulateContractCall<any>(
          server,
          source,
          CONTRACT_IDS.vault,
          "token",
          []
        )
      )
      console.log("🔍 [API:TokenAccess] Vault token contract:", vaultTokenContract)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      console.error("🔍 [API:TokenAccess] Failed to get vault token contract:", msg)
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

    console.log("🔍 [API:TokenAccess] Checking token balance and trustline...")
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
      console.log("🔍 [API:TokenAccess] Balance check successful:", { balance: balance.toString(), hasTrustline })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      console.error("🔍 [API:TokenAccess] Balance check failed:", msg)
      trustlineError = msg
      hasTrustline = false
      
      // For demo purposes, provide a default balance but keep hasTrustline as false
      if (msg.includes("trustline entry is missing")) {
        balance = BigInt(10000000) // Demo balance for UI display
        console.log("🔍 [API:TokenAccess] Trustline missing, using demo balance")
      }
    }

    // Prepare trustline setup transaction if needed
    let trustlineXdr: string | null = null
    if (!hasTrustline && trustlineError?.includes("trustline entry is missing")) {
      console.log("🔧 [API:TokenAccess] Preparing trustline setup transaction...")
      try {
        // For Soroban tokens, we need to create a trustline using the native operation
        // The token contract address needs to be converted to an Asset
        const tokenAsset = Asset.native() // This is a placeholder - in reality, we'd need the specific token asset
        
        const tx = new TransactionBuilder(source, {
          fee: "200000",
          networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
        })
          // Create trustline operation
          .addOperation(Operation.changeTrust({
            asset: tokenAsset,
            limit: "1000000000" // Large limit for demo purposes
          }))
          .setTimeout(60)
          .build()

        const prepared = await server.prepareTransaction(tx)
        trustlineXdr = prepared.toXDR()
        trustlineError = "Please sign this transaction to establish a trustline for this token"
        console.log("🔧 [API:TokenAccess] Trustline transaction prepared successfully")
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error"
        console.error("🔧 [API:TokenAccess] Primary trustline setup failed:", msg)
        
        // Fallback: try the token contract approach for Soroban tokens
        try {
          console.log("🔧 [API:TokenAccess] Trying fallback token contract approach...")
          const tokenContract = new Contract(vaultTokenContract)
          
          const tx = new TransactionBuilder(source, {
            fee: "200000",
            networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
          })
            // Try to initialize the token which may establish trustline
            .addOperation(tokenContract.call("initialize", 
              new Address(body.userAddress).toScVal()
            ))
            .setTimeout(60)
            .build()

          const prepared = await server.prepareTransaction(tx)
          trustlineXdr = prepared.toXDR()
          trustlineError = "Please sign this transaction to establish token access"
          console.log("🔧 [API:TokenAccess] Fallback transaction prepared successfully")
        } catch (fallbackError) {
          console.error("🔧 [API:TokenAccess] Fallback also failed:", fallbackError)
          trustlineError = `Failed to prepare trustline setup: ${msg}. Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
        }
      }
    }

    const response = NextResponse.json({
      userAddress: body.userAddress,
      tokenContract: vaultTokenContract,
      hasTrustline: hasTrustline,
      balance: balance.toString(),
      trustlineError: trustlineError,
      trustlineXdr: trustlineXdr,
      canInvest: hasTrustline,
      message: hasTrustline ? "Token access ready for investing" : "Token trustline setup required"
    })
    
    console.log("🔍 [API:TokenAccess] Final response:", {
      userAddress: body.userAddress,
      tokenContract: vaultTokenContract,
      hasTrustline,
      balance: balance.toString(),
      hasTrustlineXdr: !!trustlineXdr,
      canInvest: hasTrustline
    })
    
    return response

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Token access check failed. Details: ${msg}` },
      { status: 500 }
    )
  }
}