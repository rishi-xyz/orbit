"use client"

import * as React from "react"
import { WalletIcon, LogOutIcon, CopyIcon, ExternalLinkIcon } from "lucide-react"
import { useWallet } from "@/providers/wallet-provider"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export function WalletConnect() {
    const { address, isConnected, connecting, connect, disconnect } = useWallet()

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address)
            toast.success("Address copied to clipboard")
        }
    }

    const openExplorer = () => {
        if (address) {
            window.open(`https://stellar.expert/explorer/testnet/account/${address}`, "_blank")
        }
    }

    if (!isConnected) {
        return (
            <Button
                variant="outline"
                size="sm"
                disabled={connecting}
                onClick={() => connect()}
                className="h-9 gap-2 px-4 font-medium transition-all hover:bg-primary hover:text-primary-foreground"
            >
                <WalletIcon className="h-4 w-4" />
                {connecting ? "Connecting..." : "Connect Wallet"}
            </Button>
        )
    }

    const truncatedAddress = `${address?.slice(0, 4)}...${address?.slice(-4)}`

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 px-3 font-mono text-xs transition-all hover:bg-accent"
                >
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    {truncatedAddress}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Connected Wallet</p>
                        <p className="text-muted-foreground font-mono text-[10px] leading-none">
                            {address}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={copyAddress} className="gap-2 focus:bg-accent/50">
                    <CopyIcon className="h-4 w-4" />
                    <span>Copy Address</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openExplorer} className="gap-2 focus:bg-accent/50">
                    <ExternalLinkIcon className="h-4 w-4" />
                    <span>View on Explorer</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={disconnect}
                    className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                    <LogOutIcon className="h-4 w-4" />
                    <span>Disconnect</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
