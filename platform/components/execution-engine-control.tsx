"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ExecutionEngineStatus {
  isMonitoring: boolean
  activeStrategies: number
  strategies: any[]
}

export function ExecutionEngineControl() {
  const [status, setStatus] = React.useState<ExecutionEngineStatus | null>(null)
  const [loading, setLoading] = React.useState(false)

  async function fetchStatus() {
    try {
      const response = await fetch("/api/execution-engine")
      if (response.ok) {
        const data = await response.json()
        setStatus(data.status)
      }
    } catch (e) {
      console.error("Failed to fetch execution engine status:", e)
    }
  }

  async function controlEngine(action: string) {
    setLoading(true)
    try {
      const response = await fetch("/api/execution-engine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        await fetchStatus()
      } else {
        const error = await response.json()
        toast.error("Operation failed", {
          description: error.error || "Unknown error",
        })
      }
    } catch (e) {
      toast.error("Operation failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchStatus()
    
    // Poll status every 10 seconds
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Backend Execution Engine</CardTitle>
          <CardDescription>Loading status...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backend Execution Engine</CardTitle>
        <CardDescription>
          Automated strategy monitoring and execution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Status:</span>
            <p className={status.isMonitoring ? "text-green-600" : "text-red-600"}>
              {status.isMonitoring ? "Active" : "Stopped"}
            </p>
          </div>
          <div>
            <span className="font-medium">Active Strategies:</span>
            <p>{status.activeStrategies}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={status.isMonitoring ? "destructive" : "default"}
            onClick={() => controlEngine(status.isMonitoring ? "stop" : "start")}
            disabled={loading}
          >
            {loading 
              ? "Processing..." 
              : status.isMonitoring 
                ? "Stop Engine" 
                : "Start Engine"
            }
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={fetchStatus}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        {status.isMonitoring && (
          <Alert>
            <AlertDescription>
              The execution engine is actively monitoring strategies and will automatically execute trades when conditions are met.
            </AlertDescription>
          </Alert>
        )}

        {status.activeStrategies > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Monitored Strategies:</h4>
            <div className="space-y-1">
              {status.strategies.map((strategy, index) => (
                <div key={index} className="text-xs p-2 bg-muted rounded">
                  Strategy #{strategy.algoId} - {strategy.creatorAddress}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}