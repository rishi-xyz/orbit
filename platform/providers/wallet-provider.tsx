"use client"

import * as React from "react"
import { StellarWalletsKit, WalletNetwork, allowAllModules } from "@creit.tech/stellar-wallets-kit"
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
    const kitRef = React.useRef<StellarWalletsKit | null>(null)

    React.useEffect(() => {
        if (kitRef.current) return
        
        console.log("🔗 [Wallet] Initializing StellarWalletsKit...")
        
        try {
            kitRef.current = new StellarWalletsKit({
                network: WalletNetwork.TESTNET,
                modules: allowAllModules()
            })

            // Set the wallet to Freighter
            kitRef.current.setWallet("freighter")

            console.log("🔗 [Wallet] StellarWalletsKit initialized successfully")

            // Check if already connected
            checkConnection()
        } catch (error) {
            console.error("🔗 [Wallet] Failed to initialize StellarWalletsKit:", error)
            toast.error("Failed to initialize wallet", {
                description: "Please refresh the page and try again",
            })
        }
    }, [])

    async function checkConnection() {
        if (!kitRef.current) return
        try {
            const res = await kitRef.current.getAddress()
            if (res?.address) {
                setAddress(res.address)
            }
        } catch {
            // Not connected
        }
    }

    async function connect() {
        if (connecting || !kitRef.current) return null
        setConnecting(true)
        try {
            console.log("🔗 [Wallet] Attempting to connect wallet...")
            
            // Ensure wallet is set before attempting to connect
            kitRef.current.setWallet("freighter")
            console.log("🔗 [Wallet] Set wallet to Freighter")
            
            // Small delay to ensure wallet is properly set
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Now try to get address
            const res = await kitRef.current.getAddress()
            console.log("🔗 [Wallet] getAddress response:", res)
            
            if (res?.address) {
                setAddress(res.address)
                toast.success("Wallet connected", { description: res.address })
                return res.address
            }
            
            toast.error("Connection failed", {
                description: "Unable to get wallet address. Make sure Freighter is installed and unlocked.",
            })
            return null
        } catch (e) {
            console.error("🔗 [Wallet] Connection error:", e)
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
