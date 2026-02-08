"use client"

import * as React from "react"
import { AppShell } from "@/components/app-shell"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk"
import { fetchRegistryAlgos } from "@/lib/soroban"

type Investment = {
  id: string
  algoId: number
  algoName: string
  amount: string
  timestamp: Date
  txHash?: string
  status: "pending" | "confirmed" | "failed"
}

function formatUsd(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value
  return num.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  })
}

function formatDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function Portfolio() {
  // Load investment data from localStorage
  const [investments, setInvestments] = React.useState<Investment[]>([])
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null)
  const [totalInvested, setTotalInvested] = React.useState<string>("0")

  React.useEffect(() => {
    // Load wallet address
    async function loadWallet() {
      try {
        const res = (await StellarWalletsKit.getAddress()) as { address: string }
        if (res?.address) {
          setWalletAddress(res.address)
        }
      } catch {
        // Wallet not connected
      }
    }
    
    // Load investments from localStorage with proper date parsing
    const storedInvestments = localStorage.getItem('investments')
    if (storedInvestments) {
      try {
        const parsedInvestments = JSON.parse(storedInvestments)
        // Convert timestamp strings back to Date objects
        const investmentsWithDates = parsedInvestments.map((inv: any) => ({
          ...inv,
          timestamp: new Date(inv.timestamp)
        }))
        setInvestments(investmentsWithDates)
        console.log("📊 [Portfolio] Loaded investments:", investmentsWithDates.length)
      } catch (e) {
        console.error("📊 [Portfolio] Failed to parse investments:", e)
        localStorage.removeItem('investments') // Clear corrupted data
      }
    }
    
    loadWallet()
  }, [])

  React.useEffect(() => {
    // Calculate total invested whenever investments change
    const total = investments
      .filter(inv => inv.status === "confirmed")
      .reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
    setTotalInvested(total.toString())
  }, [investments])

  const handleRefresh = async () => {
    try {
      const res = (await StellarWalletsKit.getAddress()) as { address: string }
      if (res?.address) {
        // Reload investments from localStorage
        const storedInvestments = localStorage.getItem('investments')
        if (storedInvestments) {
          try {
            const parsedInvestments = JSON.parse(storedInvestments)
            const investmentsWithDates = parsedInvestments.map((inv: any) => ({
              ...inv,
              timestamp: new Date(inv.timestamp)
            }))
            setInvestments(investmentsWithDates)
            console.log("📊 [Portfolio] Refreshed investments:", investmentsWithDates.length)
          } catch (e) {
            console.error("📊 [Portfolio] Failed to parse investments on refresh:", e)
          }
        }
        toast.success("Portfolio refreshed", {
          description: `Found ${investments.length} investments.`
        })
      }
    } catch {
      toast.error("Failed to refresh", {
        description: "Please connect your wallet first."
      })
    }
  }

  const getStatusBadge = (status: Investment["status"]) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {walletAddress ? `Connected: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}` : "Connect wallet to view portfolio"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Refresh
            </Button>
          </div>
        </div>

        <Separator />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              <CardDescription>Across all strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">
                ${formatUsd(totalInvested)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
              <CardDescription>Number of strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">
                {investments.filter(inv => inv.status === "confirmed").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <CardDescription>Awaiting confirmation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">
                {investments.filter(inv => inv.status === "pending").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Investments List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Investment History</h2>
          
          {investments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-lg font-medium mb-2">No investments yet</p>
                  <p className="text-sm">
                    Start investing in strategies to see your portfolio grow.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {investments.map((investment) => (
                <Card key={investment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{investment.algoName}</h3>
                          {getStatusBadge(investment.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-medium ml-1">
                              ${formatUsd(parseFloat(investment.amount) / 10000000)} {/* Convert from stroops */}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium ml-1">
                              {formatDateTime(investment.timestamp)}
                            </span>
                          </div>
                        </div>
                        {investment.txHash && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Transaction: {investment.txHash.slice(0, 12)}...{investment.txHash.slice(-6)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
