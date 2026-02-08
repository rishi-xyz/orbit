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
      investorAddress?: string
      amount?: string | number
    }

    if (!body?.creatorAddress) {
      return NextResponse.json({ error: "Missing required field: creatorAddress" }, { status: 400 })
    }

    if (!body?.investorAddress) {
      return NextResponse.json({ error: "Missing required field: investorAddress" }, { status: 400 })
    }

    const amountRaw =
      typeof body.amount === "number" || typeof body.amount === "string"
        ? String(body.amount)
        : ""

    if (!amountRaw) {
      return NextResponse.json(
        { error: "Missing required field: amount" },
        { status: 400 }
      )
    }

    let amount: bigint
    try {
      amount = BigInt(amountRaw)
    } catch {
      return NextResponse.json(
        { error: "Invalid amount. Must be an integer string." },
        { status: 400 }
      )
    }

    if (amount <= BigInt(0)) {
      return NextResponse.json(
        { error: "Amount must be positive" },
        { status: 400 }
      )
    }

    const server = getSorobanServer()

    let source
    try {
      source = await server.getAccount(body.investorAddress)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      return NextResponse.json(
        {
          error:
            `Could not load Stellar account ${body.investorAddress}. ` +
            `Make sure your wallet is funded/activated on the selected network. Details: ${msg}`,
        },
        { status: 400 }
      )
    }

    // Get creator vault address
    let vaultAddress: string
    try {
      vaultAddress = String(
        await simulateContractCall<any>(
          server,
          source,
          CONTRACT_IDS.algoRegistry,
          "get_creator_vault",
          [new Address(body.creatorAddress).toScVal()]
        )
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      return NextResponse.json(
        {
          error: `Creator does not have a vault. Details: ${msg}`,
        },
        { status: 400 }
      )
    }

    // Get vault token contract for balance check
    let vaultTokenContract: string
    try {
      const vaultInfo = await simulateContractCall<any>(
        server,
        source,
        vaultAddress,
        "get_vault_info",
        []
      )
      vaultTokenContract = vaultInfo[1] // token_contract is second element
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      return NextResponse.json(
        {
          error: `Could not read vault token configuration. Details: ${msg}`,
        },
        { status: 500 }
      )
    }

    // Check investor's token balance
    try {
      const bal = await simulateContractCall<any>(
        server,
        source,
        vaultTokenContract,
        "balance",
        [new Address(body.investorAddress).toScVal()]
      )

      const balance =
        typeof bal === "bigint" ? bal : typeof bal === "number" ? BigInt(bal) : BigInt(String(bal))

      if (balance < amount) {
        return NextResponse.json(
          {
            error:
              `Insufficient token balance to invest. ` +
              `Token contract: ${vaultTokenContract}. ` +
              `Balance: ${balance.toString()}, required: ${amount.toString()}. ` +
              `You need this Soroban token in your wallet before depositing into the creator vault.`,
          },
          { status: 400 }
        )
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      return NextResponse.json(
        {
          error:
            `Could not fetch token balance for investor. ` +
            `Token contract: ${vaultTokenContract}. Details: ${msg}`,
        },
        { status: 400 }
      )
    }

    // Prepare deposit transaction to creator vault
    const contract = new Contract(vaultAddress)

    const tx = new TransactionBuilder(source, {
      fee: "100000",
      networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "deposit",
          new Address(body.investorAddress).toScVal(),
          nativeToScVal(amount, { type: "i128" })
        )
      )
      .setTimeout(60)
      .build()

    try {
      const prepared = await server.prepareTransaction(tx)
      return NextResponse.json({ 
        xdr: prepared.toXDR(), 
        creatorAddress: body.creatorAddress,
        vaultAddress: vaultAddress,
        amount: amount.toString()
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      return NextResponse.json(
        {
          error:
            "Failed to prepare creator vault investment transaction. " +
            "Details: " +
            msg,
        },
        { status: 500 }
      )
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Invalid request or server error. Details: ${msg}` },
      { status: 500 }
    )
  }
}