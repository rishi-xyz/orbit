import { NextResponse } from "next/server"
import { Contract, TransactionBuilder, scValToNative, xdr } from "@stellar/stellar-sdk"

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

export async function GET() {
  const server = getSorobanServer()

  try {
    const source = await server.getAccount(
      process.env.NEXT_PUBLIC_READONLY_SOURCE_ACCOUNT ??
      "GBOQA7EK4NYZNQU2OQVTZ4VBOW6ZTHO4IICW5KREIHGORBJASQDHILBR"
    )

    const contractId = CONTRACT_IDS.vault

    let owner: string | null = null
    let token: string | null = null
    let executor: string | null = null
    let history: string | null = null

    try {
      owner = String(await simulateContractCall<any>(server, source, contractId, "owner", []))
    } catch {
      owner = null
    }

    try {
      token = String(await simulateContractCall<any>(server, source, contractId, "token", []))
    } catch {
      token = null
    }

    try {
      const ex = await simulateContractCall<any>(server, source, contractId, "executor", [])
      executor = ex ? String(ex) : null
    } catch {
      executor = null
    }

    try {
      const h = await simulateContractCall<any>(server, source, contractId, "history", [])
      history = h ? String(h) : null
    } catch {
      history = null
    }

    return NextResponse.json({ contractId, owner, token, executor, history })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
