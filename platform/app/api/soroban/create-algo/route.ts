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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      owner?: string
      name?: string
      metadataUri?: string
      paramsHash?: string
    }

    if (!body?.owner || !body?.name) {
      return NextResponse.json(
        { error: "Missing required fields: owner, name" },
        { status: 400 }
      )
    }

    if (!CONTRACT_IDS.algoRegistry) {
      return NextResponse.json(
        { error: "Missing Algo Registry contract id" },
        { status: 500 }
      )
    }

    const server = getSorobanServer()

    let source
    try {
      source = await server.getAccount(body.owner)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      return NextResponse.json(
        {
          error:
            `Could not load Stellar account ${body.owner}. ` +
            `Make sure your wallet is funded/activated on the selected network (Testnet). Details: ${msg}`,
        },
        { status: 400 }
      )
    }

    const contract = new Contract(CONTRACT_IDS.algoRegistry)

    const tx = new TransactionBuilder(source, {
      fee: "100000",
      networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "create_algo",
          new Address(body.owner).toScVal(),
          nativeToScVal(body.name, { type: "string" }),
          nativeToScVal(body.metadataUri ?? "", { type: "string" }),
          nativeToScVal(body.paramsHash ?? "", { type: "string" })
        )
      )
      .setTimeout(60)
      .build()

    try {
      const prepared = await server.prepareTransaction(tx)
      return NextResponse.json({ xdr: prepared.toXDR() })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      return NextResponse.json(
        {
          error:
            "Failed to prepare Soroban transaction. " +
            "This usually means simulation failed (wrong contract id, wrong network, or contract error). " +
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
