import { AppShell } from "@/components/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import Link from "next/link"

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Welcome to Orbit - Your DeFi Strategy Platform
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Platform Overview
              </CardTitle>
              <CardDescription>Quick stats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Active Strategies</span>
                  <Badge variant="secondary">Demo Mode</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Network</span>
                  <Badge variant="outline">Testnet</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Quick Actions
              </CardTitle>
              <CardDescription>Get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/builder">Create Strategy</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/demo-strategies">View Demos</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Resources
              </CardTitle>
              <CardDescription>Learn more</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" asChild className="w-full justify-start">
                <Link href="/strategies">Browse Strategies</Link>
              </Button>
              <Button variant="ghost" asChild className="w-full justify-start">
                <Link href="/">Stellar Markets</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Getting Started
              </CardTitle>
              <CardDescription>New here?</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Start with demo strategies to understand how automated trading works on Stellar.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Platform Features</CardTitle>
            <CardDescription>What you can do with Orbit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <h3 className="font-medium">🛠️ Strategy Builder</h3>
                <p className="text-sm text-muted-foreground">
                  Create custom trading strategies using our visual flow builder
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">📊 Market Data</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time Stellar market data and price charts
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">💎 Demo Strategies</h3>
                <p className="text-sm text-muted-foreground">
                  Pre-built strategies for learning and testing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}