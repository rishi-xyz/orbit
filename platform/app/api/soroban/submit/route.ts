import { NextResponse } from "next/server"
import { Transaction } from "@stellar/stellar-sdk"

import { SOROBAN_NETWORK_PASSPHRASE, getSorobanServer } from "@/lib/soroban"

export async function POST(req: Request) {
  const body = (await req.json()) as { xdr: string }

  if (!body?.xdr) {
    return NextResponse.json({ error: "Missing xdr" }, { status: 400 })
  }

  const server = getSorobanServer()
  const tx = new Transaction(body.xdr, SOROBAN_NETWORK_PASSPHRASE)

  const send = await server.sendTransaction(tx)

  return NextResponse.json(send)
}
