"use client"

import * as React from "react"
import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk"
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils"
import { toast } from "sonner"

interface WalletContextType {
    address: string | null
    isConnected: boolean
    connecting: boolean
    connect: () => Promise<string | null>
    disconnect: () => void
}

const WalletContext = React.createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [address, setAddress] = React.useState<string | null>(null)
    const [connecting, setConnecting] = React.useState(false)
    const kitReadyRef = React.useRef(false)

    React.useEffect(() => {
        if (kitReadyRef.current) return
        StellarWalletsKit.init({ modules: defaultModules() })
        kitReadyRef.current = true

        // Check if already connected
        checkConnection()
    }, [])

    async function checkConnection() {
        try {
            const res = (await StellarWalletsKit.getAddress()) as { address: string }
            if (res?.address) {
                setAddress(res.address)
            }
        } catch {
            // Not connected
        }
    }

    async function connect() {
        if (connecting) return null
        setConnecting(true)
        try {
            const res = (await StellarWalletsKit.authModal()) as { address: string }
            if (res?.address) {
                setAddress(res.address)
                toast.success("Wallet connected", { description: res.address })
                return res.address
            }
            return null
        } catch (e) {
            toast.error("Failed to connect wallet", {
                description: e instanceof Error ? e.message : "Unknown error",
            })
            return null
        } finally {
            setConnecting(false)
        }
    }

    function disconnect() {
        setAddress(null)
        toast.info("Wallet disconnected")
    }

    return (
        <WalletContext.Provider
            value={{
                address,
                isConnected: !!address,
                connecting,
                connect,
                disconnect,
            }}
        >
            {children}
        </WalletContext.Provider>
    )
}

export function useWallet() {
    const context = React.useContext(WalletContext)
    if (context === undefined) {
        throw new Error("useWallet must be used within a WalletProvider")
    }
    return context
}
