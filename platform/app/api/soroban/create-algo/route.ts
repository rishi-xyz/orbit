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
  const body = (await req.json()) as {
    owner: string
    name: string
    metadataUri: string
    paramsHash: string
  }

  if (!body?.owner || !body?.name) {
    return NextResponse.json(
      { error: "Missing required fields: owner, name" },
      { status: 400 }
    )
  }

  const server = getSorobanServer()
  const source = await server.getAccount(body.owner)

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

  const prepared = await server.prepareTransaction(tx)

  return NextResponse.json({ xdr: prepared.toXDR() })
}
