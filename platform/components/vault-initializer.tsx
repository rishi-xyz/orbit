"use client"

import * as React from "react"
import { StellarWalletsKit, WalletNetwork, allowAllModules } from "@creit.tech/stellar-wallets-kit"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function VaultInitializer() {
  const [loading, setLoading] = React.useState(false)
  const [vaultStatus, setVaultStatus] = React.useState<{
    initialized: boolean
    owner?: string
    token?: string
  } | null>(null)

  React.useEffect(() => {
    checkVaultStatus()
  }, [])

  async function checkVaultStatus() {
    try {
      const response = await fetch("/api/soroban/vault-status")
      const data = await response.json()
      
      setVaultStatus({
        initialized: !!(data.owner && data.token),
        owner: data.owner,
        token: data.token
      })
    } catch (e) {
      console.error("Failed to check vault status:", e)
    }
  }

  async function initializeVault() {
    if (loading) return
    setLoading(true)

    try {
      console.log("🏗️ [Vault] Starting vault initialization...")
      
      // Get wallet address
      const kit = new StellarWalletsKit({
        network: WalletNetwork.TESTNET,
        modules: allowAllModules()
      })
      kit.setWallet("freighter")
      
      const walletRes = await kit.getAddress()
      if (!walletRes?.address) {
        throw new Error("Please connect your wallet first")
      }

      console.log("🏗️ [Vault] Wallet address:", walletRes.address)

      // Get initialization transaction
      const initRes = await fetch("/api/soroban/vault-init", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          owner: walletRes.address,
          tokenContract: "native" // Use native XLM for simplicity
        })
      })

      if (!initRes.ok) {
        const error = await initRes.json()
        throw new Error(error.error || "Failed to prepare vault initialization")
      }

      const { xdr } = await initRes.json()
      console.log("🏗️ [Vault] Got initialization XDR")

      // Request wallet signature
      const signRes = await kit.signTransaction(xdr, {
        networkPassphrase: "Test SDF Network ; September 2015",
        address: walletRes.address,
      })

      if (!signRes?.signedTxXdr) {
        throw new Error("Wallet did not sign the transaction")
      }

      console.log("🏗️ [Vault] Transaction signed, submitting...")

      // Submit transaction
      const submitRes = await fetch("/api/soroban/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ xdr: signRes.signedTxXdr })
      })

      if (!submitRes.ok) {
        const error = await submitRes.json()
        throw new Error(error.error || "Failed to submit vault initialization")
      }

      const submitData = await submitRes.json()
      
      toast.success("Vault initialized successfully!", {
        description: submitData.hash ? `Tx: ${submitData.hash}` : "Vault is ready for investments"
      })

      // Re-check status
      await checkVaultStatus()
    } catch (e) {
      console.error("🏗️ [Vault] Initialization failed:", e)
      toast.error("Vault initialization failed", {
        description: e instanceof Error ? e.message : "Unknown error"
      })
    } finally {
      setLoading(false)
    }
  }

  if (vaultStatus?.initialized) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <AlertDescription className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="font-medium text-green-900">✅ Vault Ready</p>
          </div>
          <p className="text-sm text-green-800">
            Vault is initialized and ready for investments. You can now invest in strategies.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertDescription className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <p className="font-medium text-orange-900">🏗️ Vault Setup Required</p>
        </div>
        <p className="text-sm text-orange-800">
          The vault contract needs to be initialized before you can invest. This is a one-time setup that requires wallet approval.
        </p>
        <Button
          onClick={initializeVault}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Initializing Vault...
            </>
          ) : (
            <>
              <div className="w-4 h-4 mr-2">🏗️</div>
              Initialize Vault (Requires Wallet Approval)
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  )
}