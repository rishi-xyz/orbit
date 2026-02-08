"use client"

import * as React from "react"
import { AlertCircle, CheckCircle2, Loader2, Rocket, ExternalLink } from "lucide-react"
import { StellarWalletsKit, WalletNetwork, allowAllModules } from "@creit.tech/stellar-wallets-kit"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useWallet } from "@/providers/wallet-provider"

interface VaultStatus {
    contractId: string
    owner: string | null
    token: string | null
    executor: string | null
    history: string | null
}

export function VaultStatusCard() {
    const [status, setStatus] = React.useState<VaultStatus | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [initializing, setInitializing] = React.useState(false)
    const { address, isConnected, connect } = useWallet()

    const fetchStatus = React.useCallback(async () => {
        try {
            const res = await fetch("/api/soroban/vault-status")
            if (res.ok) {
                setStatus(await res.json())
            }
        } catch (e) {
            console.error("Failed to fetch vault status", e)
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchStatus()
    }, [fetchStatus])

    async function onInitialize() {
        if (initializing) return

        if (!isConnected) {
            const pk = await connect()
            if (!pk) return
        }

        setInitializing(true)
        try {
            const res = await fetch("/api/soroban/vault-init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ owner: address }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to prepare init transaction")

            const { xdr } = data

            const kit = new StellarWalletsKit({
                network: WalletNetwork.TESTNET,
                modules: allowAllModules()
            })

            const signed = await kit.signTransaction(xdr, {
                networkPassphrase: "Test SDF Network ; September 2015",
                address: address!,
            })

            if (!signed?.signedTxXdr) throw new Error("Failed to sign transaction")

            const submitRes = await fetch("/api/soroban/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ xdr: signed.signedTxXdr }),
            })

            const submitData = await submitRes.json()
            if (!submitRes.ok) throw new Error(submitData.error || "Transaction submission failed")

            toast.success("Vault initialized successfully!")
            fetchStatus()
        } catch (e) {
            toast.error("Initialization failed", {
                description: e instanceof Error ? e.message : "Unknown error",
            })
        } finally {
            setInitializing(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    const isInitialized = !!status?.owner && !!status?.token

    if (isInitialized) {
        return (
            <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <CardTitle className="text-sm font-medium">Vault Online</CardTitle>
                    </div>
                    <CardDescription>
                        The global multi-strategy vault is active on Testnet.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Contract:</span>
                            <span className="font-mono">{status?.contractId.slice(0, 8)}...{status?.contractId.slice(-8)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Token:</span>
                            <span className="font-mono">{status?.token?.slice(0, 8)}...{status?.token?.slice(-8)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-sm font-medium text-amber-500">
                        Vault Not Initialized
                    </CardTitle>
                </div>
                <CardDescription>
                    Investments are currently disabled because the vault contract has not been configured.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
                    <Rocket className="h-4 w-4" />
                    <AlertTitle>Admin Action Required</AlertTitle>
                    <AlertDescription className="text-xs">
                        The owner must call `init(owner, token)` to activate the vault.
                    </AlertDescription>
                </Alert>
                <Button
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={onInitialize}
                    disabled={initializing}
                >
                    {initializing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Initializing...
                        </>
                    ) : (
                        "Initialize Vault"
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
