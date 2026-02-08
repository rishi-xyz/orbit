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

    // Check if using native XLM or token
    let isNativeToken = false
    let vaultTokenContract: string = "native"
    
    try {
      console.log("🔍 [API:TokenAccess] Getting vault token contract...")
      const tokenContractResult = String(
        await simulateContractCall<any>(
          server,
          source,
          CONTRACT_IDS.vault,
          "token",
          []
        )
      )
      
      // If contract returns "native" or empty, use native XLM
      if (tokenContractResult === "native" || !tokenContractResult) {
        isNativeToken = true
        vaultTokenContract = "native"
        console.log("🔍 [API:TokenAccess] Using native XLM token")
      } else {
        vaultTokenContract = tokenContractResult
        console.log("🔍 [API:TokenAccess] Vault token contract:", vaultTokenContract)
      }
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
    let hasTrustline: boolean = true // Native XLM doesn't need trustline
    let trustlineError: string | null = null
    
    console.log("🔍 [API:TokenAccess] Checking token balance...")
    
    if (isNativeToken) {
      // For native XLM, get balance directly from account
      try {
        balance = BigInt(source.balances[0]?.balance || "0") // First balance is usually XLM
        console.log("🔍 [API:TokenAccess] Native XLM balance:", balance.toString())
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error"
        console.error("🔍 [API:TokenAccess] Failed to get XLM balance:", msg)
        balance = BigInt(0)
      }
    } else {
      // For token contracts, check balance via contract
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
        console.log("🔍 [API:TokenAccess] Token balance check successful:", { balance: balance.toString(), hasTrustline })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error"
        console.error("🔍 [API:TokenAccess] Token balance check failed:", msg)
        trustlineError = msg
        hasTrustline = false
        
        // For demo purposes, provide a default balance but keep hasTrustline as false
        if (msg.includes("trustline entry is missing")) {
          balance = BigInt(10000000) // Demo balance for UI display
          console.log("🔍 [API:TokenAccess] Trustline missing, using demo balance")
        }
      }
    }

    // Prepare trustline setup transaction if needed
    let trustlineXdr: string | null = null
    
    if (isNativeToken) {
      // Native XLM doesn't need trustline setup
      console.log("🔧 [API:TokenAccess] Using native XLM - no trustline needed")
    } else if (!hasTrustline && trustlineError?.includes("trustline entry is missing")) {
      console.log("🔧 [API:TokenAccess] Soroban token trustline missing - providing manual setup instructions")
      
      // For Soroban tokens, traditional changeTrust operations don't work
      // Users need to manually add the token through their wallet
      const manualInstructions = `
This is a Soroban token that requires manual setup:

Token Contract: ${vaultTokenContract}

To add this token to your wallet:
1. Open your Stellar wallet (Freighter, Albedo, etc.)
2. Go to "Add Token" or "Manage Trustlines"
3. Choose "Add Custom Token"
4. Enter the contract address: ${vaultTokenContract}
5. Set a limit (recommended: 1000000000)
6. Approve the transaction

After adding the token, return here and try investing again.
      `.trim()
      
      console.log("🔧 [API:TokenAccess] Manual setup instructions prepared")
      trustlineError = manualInstructions
    }

    const response = NextResponse.json({
      userAddress: body.userAddress,
      tokenContract: vaultTokenContract,
      isNativeToken: isNativeToken,
      hasTrustline: hasTrustline,
      balance: balance.toString(),
      trustlineError: trustlineError,
      trustlineXdr: trustlineXdr,
      canInvest: hasTrustline,
        message: hasTrustline ? (isNativeToken ? "Ready to invest with XLM" : "Token access ready for investing") : "Token trustline setup required - see instructions below"
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