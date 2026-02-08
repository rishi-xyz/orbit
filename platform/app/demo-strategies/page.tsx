"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DemoStrategy {
  id?: number
  name: string
  description: string
  owner?: string
  active?: boolean
  paramsHash?: string
  status?: string
  transactionXdr?: string
  flow?: any
}

export default function DemoStrategiesPage() {
  const [strategies, setStrategies] = React.useState<DemoStrategy[]>([])
  const [loading, setLoading] = React.useState(false)
  const [creating, setCreating] = React.useState(false)

  async function fetchStrategies() {
    setLoading(true)
    try {
      const response = await fetch("/api/demo-strategies")
      if (response.ok) {
        const data = await response.json()
        setStrategies(data.strategies || [])
      }
    } catch (e) {
      toast.error("Failed to fetch demo strategies", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  async function createDemoStrategies() {
    setCreating(true)
    try {
      const response = await fetch("/api/demo-strategies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Demo strategies prepared", {
          description: `${data.strategies.length} strategies ready for deployment`,
        })
        
        // Show details of prepared strategies
        console.log("Prepared strategies:", data.strategies)
        
        // Refresh the list
        await fetchStrategies()
      } else {
        const error = await response.json()
        toast.error("Failed to create demo strategies", {
          description: error.error || "Unknown error",
        })
      }
    } catch (e) {
      toast.error("Failed to create demo strategies", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setCreating(false)
    }
  }

  React.useEffect(() => {
    fetchStrategies()
  }, [])

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Demo Strategies</h1>
          <p className="text-muted-foreground mt-2">
            Pre-built trading strategies for testing and demonstration
          </p>
        </div>
        <Button onClick={createDemoStrategies} disabled={creating}>
          {creating ? "Creating..." : "Create Demo Strategies"}
        </Button>
      </div>

      {strategies.length === 0 && !loading && (
        <Alert>
          <AlertDescription>
            No demo strategies found yet. Click "Create Demo Strategies" to deploy them.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {strategies.map((strategy, index) => (
          <Card key={strategy.id || index}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{strategy.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {strategy.description}
                  </CardDescription>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  strategy.active 
                    ? "bg-green-100 text-green-800" 
                    : strategy.status === "template_ready"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {strategy.active 
                    ? "Active" 
                    : strategy.status === "template_ready"
                    ? "Template Ready"
                    : strategy.status || "Inactive"
                  }
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Strategy ID:</span>
                  <p className="font-mono text-xs">{strategy.id || "Not deployed"}</p>
                </div>
                <div>
                  <span className="font-medium">Owner:</span>
                  <p className="font-mono text-xs">
                    {strategy.owner ? `${strategy.owner.slice(0, 4)}...${strategy.owner.slice(-4)}` : "Platform"}
                  </p>
                </div>
              </div>

              {strategy.paramsHash && (
                <div>
                  <span className="font-medium text-sm">Parameters:</span>
                  <p className="font-mono text-xs break-all">{strategy.paramsHash}</p>
                </div>
              )}

              {strategy.flow && (
                <div>
                  <span className="font-medium text-sm">Strategy Flow:</span>
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <p>Nodes: {strategy.flow.nodes?.length || 0}</p>
                    <p>Edges: {strategy.flow.edges?.length || 0}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {strategy.id ? (
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                ) : (
                  <Button size="sm" disabled>
                    Not Deployed
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  Invest
                </Button>
              </div>

              {strategy.name.includes("DCA") && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-sm">
                    <strong>🛡️ Safest Strategy:</strong> This DCA strategy is designed for beginners with low risk and consistent investment patterns.
                  </AlertDescription>
                </Alert>
              )}

              {strategy.name.includes("Moving Average") && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-sm">
                    <strong>📊 Technical Analysis:</strong> This strategy uses moving average crossovers for market timing and trend following.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading demo strategies...</p>
        </div>
      )}
    </div>
  )
}