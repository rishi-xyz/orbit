import { NextResponse } from "next/server"
import { Address, Contract, TransactionBuilder, nativeToScVal } from "@stellar/stellar-sdk"

import {
  CONTRACT_IDS,
  SOROBAN_NETWORK_PASSPHRASE,
  VAULT_INIT_OWNER,
  VAULT_INIT_TOKEN_CONTRACT,
  getSorobanServer,
} from "@/lib/soroban"

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      owner?: string
      tokenContract?: string
    }

    const owner = body.owner ?? VAULT_INIT_OWNER
    const tokenContract = body.tokenContract ?? VAULT_INIT_TOKEN_CONTRACT

    if (!owner || !tokenContract) {
      return NextResponse.json(
        { error: "Missing owner or tokenContract" },
        { status: 400 }
      )
    }

    if (!CONTRACT_IDS.vault) {
      return NextResponse.json({ error: "Missing Vault contract id" }, { status: 500 })
    }

    const server = getSorobanServer()

    let source
    try {
      source = await server.getAccount(owner)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      return NextResponse.json(
        {
          error:
            `Could not load owner account ${owner}. ` +
            `Make sure it exists and is funded on Testnet. Details: ${msg}`,
        },
        { status: 400 }
      )
    }

    const contract = new Contract(CONTRACT_IDS.vault)

    const tx = new TransactionBuilder(source, {
      fee: "100000",
      networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "initialize",
          new Address(owner).toScVal(),
          new Address(tokenContract).toScVal()
        )
      )
      .setTimeout(60)
      .build()

    try {
      const prepared = await server.prepareTransaction(tx)
      return NextResponse.json({ xdr: prepared.toXDR(), owner, tokenContract })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      return NextResponse.json(
        {
          error:
            "Failed to prepare vault init transaction. " +
            `Details: ${msg}`,
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
