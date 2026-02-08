"use client"

import * as React from "react"
import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function StrategyInvestButton({ algoId }: { algoId: number }) {
  const [loading, setLoading] = React.useState(false)
  const [tokenAccessStatus, setTokenAccessStatus] = React.useState<{
    hasTrustline: boolean
    needsTrustlineSetup: boolean
    trustlineXdr?: string
    tokenContract?: string
    message?: string
  } | null>(null)

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

  async function checkTokenAccess(userAddress: string) {
    console.log("🔍 [Token Access] Checking token access for address:", userAddress)
    try {
      const response = await fetch("/api/soroban/token-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userAddress }),
      })

      console.log("🔍 [Token Access] Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("🔍 [Token Access] Response data:", data)
        setTokenAccessStatus({
          hasTrustline: data.hasTrustline,
          needsTrustlineSetup: !data.hasTrustline && !!data.trustlineXdr,
          trustlineXdr: data.trustlineXdr,
          tokenContract: data.tokenContract,
          message: data.message,
        })
        return data
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("🔍 [Token Access] Error response:", errorData)
      }
    } catch (e) {
      console.error("🔍 [Token Access] Failed to check token access:", e)
    }
    return null
  }

  async function setupTokenTrustline(userAddress: string) {
    console.log("🔧 [Trustline Setup] Starting trustline setup for address:", userAddress)
    try {
      // Get token approval transaction
      console.log("🔧 [Trustline Setup] Fetching approval transaction...")
      const approvalRes = await fetch("/api/soroban/approve-token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          userAddress,
          tokenContract: tokenAccessStatus?.tokenContract 
        }),
      })

      console.log("🔧 [Trustline Setup] Approval response status:", approvalRes.status)

      if (!approvalRes.ok) {
        const error = await approvalRes.json()
        console.error("🔧 [Trustline Setup] Approval failed:", error)
        throw new Error(error.error || "Failed to prepare token approval")
      }

      const approvalData = await approvalRes.json()
      console.log("🔧 [Trustline Setup] Approval data:", approvalData)
      
      // Check if no approval is needed
      if (approvalData.noApprovalNeeded) {
        console.log("🔧 [Trustline Setup] No approval needed")
        toast.success("Token access ready", {
          description: approvalData.message,
        })
        await checkTokenAccess(userAddress)
        return true
      }

      // Sign and submit the approval transaction
      console.log("🔧 [Trustline Setup] Requesting wallet signature...")
      let signedTxXdr: string | undefined
      try {
        const res = await StellarWalletsKit.signTransaction(approvalData.xdr, {
          networkPassphrase: "Test SDF Network ; September 2015",
          address: userAddress,
        })
        signedTxXdr = res?.signedTxXdr
        console.log("🔧 [Trustline Setup] Wallet signed transaction successfully")
      } catch (e) {
        console.error("🔧 [Trustline Setup] Wallet signing failed:", e)
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.toLowerCase().includes("not currently connected")) {
          console.log("🔧 [Trustline Setup] Wallet not connected, showing auth modal...")
          const res = (await StellarWalletsKit.authModal()) as { address: string }
          const retryAddr = res?.address || userAddress
          const retry = await StellarWalletsKit.signTransaction(approvalData.xdr, {
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

      console.log("🔧 [Trustline Setup] Submitting signed transaction...")
      const submitRes = await fetch("/api/soroban/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ xdr: signedTxXdr }),
      })

      const submitJson = await submitRes.json().catch(() => ({}))
      console.log("🔧 [Trustline Setup] Submit response:", { status: submitRes.status, data: submitJson })
      
      if (!submitRes.ok) {
        throw new Error(submitJson?.error ?? "Token approval failed")
      }

      toast.success("Token access established", {
        description: submitJson?.hash ? `Tx: ${submitJson.hash}` : "You can now invest",
      })

      // Re-check token access after setup
      console.log("🔧 [Trustline Setup] Re-checking token access after setup...")
      await checkTokenAccess(userAddress)
      return true
    } catch (e) {
      console.error("🔧 [Trustline Setup] Token approval failed:", e)
      toast.error("Token approval failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
      return false
    }
  }

  async function onInvest() {
    if (loading) return

    console.log("💰 [Invest] Starting investment process for algo:", algoId)
    const raw = window.prompt(
      `Enter invest amount (stroops / token base units) for algo #${algoId}`,
      "10000000"
    )

    if (!raw) return
    const amount = raw.trim()
    if (!amount) return

    console.log("💰 [Invest] Investment amount:", amount)
    setLoading(true)
    try {
      const from = await ensureWalletConnected()
      if (!from) throw new Error("Wallet did not return an address")
      
      console.log("💰 [Invest] Connected wallet address:", from)

      // Check token access first
      console.log("💰 [Invest] Checking token access...")
      const tokenAccess = await checkTokenAccess(from)
      console.log("💰 [Invest] Token access result:", tokenAccess)
      
      if (!tokenAccess?.hasTrustline) {
        console.log("💰 [Invest] Trustline not established, showing setup UI")
        // Trustline setup is required - the UI will show the setup button
        return
      }

      console.log("💰 [Invest] Preparing investment transaction...")
      const prepareRes = await fetch("/api/soroban/invest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from, amount, algoId }),
      })

      console.log("💰 [Invest] Prepare response status:", prepareRes.status)

      if (!prepareRes.ok) {
        const j = await prepareRes.json().catch(() => ({}))
        console.error("💰 [Invest] Prepare failed:", j)
        
        // Handle trustline setup requirement
        if (j.needsTrustlineSetup && j.trustlineXdr) {
          console.log("💰 [Invest] Trustline setup required from invest endpoint")
          setTokenAccessStatus({
            hasTrustline: false,
            needsTrustlineSetup: true,
            trustlineXdr: j.trustlineXdr,
            tokenContract: j.tokenContract,
            message: j.message,
          })
          throw new Error("Token access setup required")
        }
        
        throw new Error(j?.error ?? "Failed to prepare invest transaction")
      }

      const { xdr } = (await prepareRes.json()) as { xdr: string }
      console.log("💰 [Invest] Got transaction XDR, requesting signature...")

      let signedTxXdr: string | undefined
      try {
        const res = await StellarWalletsKit.signTransaction(xdr, {
          networkPassphrase: "Test SDF Network ; September 2015",
          address: from,
        })
        signedTxXdr = res?.signedTxXdr
        console.log("💰 [Invest] Wallet signed investment transaction successfully")
      } catch (e) {
        console.error("💰 [Invest] Wallet signing failed:", e)
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.toLowerCase().includes("not currently connected")) {
          console.log("💰 [Invest] Wallet not connected, showing auth modal...")
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

      console.log("💰 [Invest] Submitting investment transaction...")
      const submitRes = await fetch("/api/soroban/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ xdr: signedTxXdr }),
      })

      const submitJson = await submitRes.json().catch(() => ({}))
      console.log("💰 [Invest] Submit response:", { status: submitRes.status, data: submitJson })
      
      if (!submitRes.ok) {
        throw new Error(submitJson?.error ?? "Transaction submit failed")
      }

      toast.success("Investment submitted", {
        description: submitJson?.hash ? `Tx: ${submitJson.hash}` : `algo #${algoId}`,
      })
    } catch (e) {
      console.error("💰 [Invest] Invest failed:", e)
      toast.error("Invest failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {tokenAccessStatus?.needsTrustlineSetup && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="font-medium text-blue-900">Token Access Required</p>
            </div>
            <p className="text-sm text-blue-800">
              You need to approve the token contract before investing. This is a one-time setup that allows the platform to check your token balance.
            </p>
            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-xs font-mono text-blue-700 mb-2">Token Contract:</p>
              <p className="text-xs font-mono break-all text-blue-600">
                {tokenAccessStatus.tokenContract}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
              onClick={async () => {
                const from = await ensureWalletConnected()
                if (from) {
                  const success = await setupTokenTrustline(from)
                  if (success) {
                    toast.success("Token access established! You can now invest.", {
                      description: "Your wallet can now interact with the token contract.",
                    })
                  }
                }
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Setting up Token Access...
                </>
              ) : (
                <>
                  <div className="w-4 h-4 mr-2">🔐</div>
                  Approve Token Contract
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <Button
        size="sm"
        disabled={loading || tokenAccessStatus?.needsTrustlineSetup}
        onClick={onInvest}
      >
        {loading ? "Investing..." : "Invest"}
      </Button>
    </div>
  )
}
