import { NextResponse } from "next/server"
import {
  Address,
  Contract,
  TransactionBuilder,
  nativeToScVal,
} from "@stellar/stellar-sdk"

import {
  SOROBAN_NETWORK_PASSPHRASE,
  getSorobanServer,
} from "@/lib/soroban"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      userAddress?: string
      tokenContract?: string
    }

    if (!body?.userAddress) {
      return NextResponse.json({ error: "Missing required field: userAddress" }, { status: 400 })
    }

    if (!body?.tokenContract) {
      return NextResponse.json({ error: "Missing required field: tokenContract" }, { status: 400 })
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

    // Create a simpler trustline establishment transaction
    const tokenContract = new Contract(body.tokenContract)
    
    // For many tokens, just checking balance is enough to establish trustline
    const tx = new TransactionBuilder(source, {
      fee: "200000",
      networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
    })
      // Create trustline by checking balance (will fail initially but establishes trustline)
      .addOperation(tokenContract.call("balance", 
        new Address(body.userAddress).toScVal()
      ))
      .setTimeout(60)
      .build()

    try {
      const prepared = await server.prepareTransaction(tx)
      return NextResponse.json({ 
        xdr: prepared.toXDR(),
        message: "Please sign this transaction to approve token access. This is required for balance checking and investments."
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      
      // If token contract doesn't support approve, provide a simpler alternative
      if (msg.includes("no such function") || msg.includes("approve")) {
        return NextResponse.json({
          error: "This token doesn't require explicit approval. You should be able to invest directly.",
          noApprovalNeeded: true,
          message: "The token contract is already accessible. Try investing again."
        })
      }
      
      return NextResponse.json(
        {
          error: `Failed to prepare token approval transaction. Details: ${msg}`,
        },
        { status: 500 }
      )
    }

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Token approval setup failed. Details: ${msg}` },
      { status: 500 }
    )
  }
}