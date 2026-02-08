"use client"

import * as React from "react"
import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CreatorVaultInfo {
  hasVault: boolean
  vaultAddress?: string
  vaultInfo?: {
    creator: string
    tokenContract: string
    balance: string
    paused: boolean
  }
}

export function CreatorVaultManager({ creatorAddress }: { creatorAddress: string }) {
  const [loading, setLoading] = React.useState(false)
  const [creatingVault, setCreatingVault] = React.useState(false)
  const [vaultInfo, setVaultInfo] = React.useState<CreatorVaultInfo | null>(null)

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

  async function fetchVaultInfo() {
    setLoading(true)
    try {
      const response = await fetch("/api/soroban/creator-vault/get", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ creatorAddress }),
      })

      if (response.ok) {
        const data = await response.json()
        setVaultInfo(data)
} else {
          const error = await response.json()
          if (error.needsContractUpdate) {
            toast.info("Creator Vault System", {
              description: "Creator vault functionality is coming soon! The contracts need to be deployed first.",
              duration: 5000,
            })
          } else {
            toast.error("Failed to fetch vault info", {
              description: error.error || "Unknown error",
            })
          }
        }
    } catch (e) {
      toast.error("Failed to fetch vault info", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  async function createVault() {
    setCreatingVault(true)
    try {
      const from = await ensureWalletConnected()
      if (!from) throw new Error("Wallet did not return an address")

      const response = await fetch("/api/soroban/creator-vault/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ creatorAddress }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        if (data.needsFactoryDeployment) {
          toast.error("Creator Vault Factory Not Deployed", {
            description: "Please deploy the CreatorVaultFactory contract first.",
          })
          return
        }
        throw new Error(data.error || "Failed to create vault")
      }

      toast.success("Creator vault created successfully", {
        description: `Vault: ${data.vaultAddress}`,
      })

      // Refresh vault info
      await fetchVaultInfo()
    } catch (e) {
      toast.error("Failed to create vault", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setCreatingVault(false)
    }
  }

  React.useEffect(() => {
    fetchVaultInfo()
  }, [creatorAddress])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Creator Vault</CardTitle>
          <CardDescription>Loading vault information...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Creator Vault</CardTitle>
        <CardDescription>
          Manage your personal vault for strategy execution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!vaultInfo?.hasVault ? (
          <div className="space-y-3">
            <Alert>
              <AlertDescription>
                You don't have a creator vault yet. Create one to start funding your strategies.
              </AlertDescription>
            </Alert>
            <Button
              onClick={createVault}
              disabled={creatingVault}
              className="w-full"
            >
              {creatingVault ? "Creating Vault..." : "Create Creator Vault"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Vault Address:</span>
                <p className="font-mono text-xs break-all">{vaultInfo.vaultAddress}</p>
              </div>
              <div>
                <span className="font-medium">Balance:</span>
                <p>{vaultInfo.vaultInfo?.balance || "0"} tokens</p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <p>{vaultInfo.vaultInfo?.paused ? "Paused" : "Active"}</p>
              </div>
              <div>
                <span className="font-medium">Token Contract:</span>
                <p className="font-mono text-xs break-all">
                  {vaultInfo.vaultInfo?.tokenContract}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchVaultInfo}>
                Refresh
              </Button>
              <Button size="sm" disabled>
                Fund Vault (Coming Soon)
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}