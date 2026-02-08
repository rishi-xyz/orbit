"use client"

import * as React from "react"
import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function StrategyInvestButton({ algoId }: { algoId: number }) {
  const [loading, setLoading] = React.useState(false)

  async function ensureWalletConnected() {
    try {
      const res = (await StellarWalletsKit.getAddress()) as { address: string }
      if (res?.address) return res.address
    } catch {
      // fallthrough
    }

    const res = (await StellarWalletsKit.authModal()) as { address: string }
    return res.address
  }

  async function onInvest() {
    if (loading) return

    const raw = window.prompt(
      `Enter invest amount (stroops / token base units) for algo #${algoId}`,
      "10000000"
    )

    if (!raw) return
    const amount = raw.trim()
    if (!amount) return

    setLoading(true)
    try {
      const from = await ensureWalletConnected()
      if (!from) throw new Error("Wallet did not return an address")

      const prepareRes = await fetch("/api/soroban/invest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from, amount, algoId }),
      })

      if (!prepareRes.ok) {
        const j = await prepareRes.json().catch(() => ({}))
        throw new Error(j?.error ?? "Failed to prepare invest transaction")
      }

      const { xdr } = (await prepareRes.json()) as { xdr: string }

      let signedTxXdr: string | undefined
      try {
        const res = await StellarWalletsKit.signTransaction(xdr, {
          networkPassphrase: "Test SDF Network ; September 2015",
          address: from,
        })
        signedTxXdr = res?.signedTxXdr
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.toLowerCase().includes("not currently connected")) {
          const res = (await StellarWalletsKit.authModal()) as { address: string }
          const retryAddr = res?.address || from
          const retry = await StellarWalletsKit.signTransaction(xdr, {
            networkPassphrase: "Test SDF Network ; September 2015",
            address: retryAddr,
          })
          signedTxXdr = retry?.signedTxXdr
        } else {
          throw e
        }
      }

      if (!signedTxXdr) {
        throw new Error("Wallet did not return a signed transaction")
      }

      const submitRes = await fetch("/api/soroban/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ xdr: signedTxXdr }),
      })

      const submitJson = await submitRes.json().catch(() => ({}))
      if (!submitRes.ok) {
        throw new Error(submitJson?.error ?? "Transaction submit failed")
      }

      toast.success("Investment submitted", {
        description: submitJson?.hash ? `Tx: ${submitJson.hash}` : `algo #${algoId}`,
      })
    } catch (e) {
      toast.error("Invest failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      disabled={loading}
      onClick={onInvest}
    >
      {loading ? "Investing..." : "Invest"}
    </Button>
  )
}
