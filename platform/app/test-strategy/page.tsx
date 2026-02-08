"use client"

import * as React from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ExecutionStatus {
  isMonitoring: boolean
  activeStrategies: number
  strategies: Array<{
    algoId: number
    conditions: Array<{ type: string; parameter: string; operator: string; value: any }>
    actions: Array<{ type: string; asset: string; amount: string; transactionXdr?: string }>
    active: boolean
  }>
}

interface ExecutionLog {
  timestamp: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
  details?: any
}

export default function TestStrategyPage() {
  const [status, setStatus] = React.useState<ExecutionStatus | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [logs, setLogs] = React.useState<ExecutionLog[]>([])

  const addLog = (message: string, type: ExecutionLog['type'] = 'info', details?: any) => {
    const newLog: ExecutionLog = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
      details
    }
    setLogs(prev => [newLog, ...prev.slice(0, 49)]) // Keep last 50 logs
  }

  const fetchStatus = async () => {
    setLoading(true)
    addLog("Fetching execution engine status...", "info")
    try {
      const response = await fetch("/api/execution-engine")
      const data = await response.json()
      setStatus(data.status)
      addLog(`Status updated: ${data.activeStrategies} active strategies`, "success", data.status)
    } catch (error) {
      console.error("Failed to fetch status:", error)
      addLog(`Failed to fetch status: ${error}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const startEngine = async () => {
    addLog("Starting execution engine...", "info")
    try {
      const response = await fetch("/api/execution-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" })
      })
      const result = await response.json()
      console.log("Engine started:", result)
      addLog("Execution engine started successfully", "success", result)
      await fetchStatus()
    } catch (error) {
      console.error("Failed to start engine:", error)
      addLog(`Failed to start engine: ${error}`, "error")
    }
  }

  const stopEngine = async () => {
    addLog("Stopping execution engine...", "info")
    try {
      const response = await fetch("/api/execution-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" })
      })
      const result = await response.json()
      console.log("Engine stopped:", result)
      addLog("Execution engine stopped", "success", result)
      await fetchStatus()
    } catch (error) {
      console.error("Failed to stop engine:", error)
      addLog(`Failed to stop engine: ${error}`, "error")
    }
  }

  React.useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Strategy Execution Test</h1>
          <div className="flex gap-2">
            <Button onClick={fetchStatus} disabled={loading} variant="outline">
              {loading ? "Refreshing..." : "Refresh Status"}
            </Button>
            <Button onClick={startEngine} variant="default">
              Start Engine
            </Button>
            <Button onClick={stopEngine} variant="destructive">
              Stop Engine
            </Button>
          </div>
        </div>

        {/* Execution Logs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Execution Logs</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLogs([])}
            >
              Clear Logs
            </Button>
          </div>
          
          <div className="bg-muted border rounded-lg p-4 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">No execution logs yet</p>
                <p className="text-xs">Start the engine and deploy strategies to see logs</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className={`text-xs font-mono p-2 rounded border-l-2 ${
                    log.type === 'error' ? 'bg-red-100 border-red-300 text-red-800' :
                    log.type === 'success' ? 'bg-green-100 border-green-300 text-green-800' :
                    log.type === 'warning' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
                    'bg-blue-100 border-blue-300 text-blue-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-muted-foreground">[{log.timestamp}]</span>
                      <Badge variant={log.type === 'error' ? 'destructive' : 'secondary'}>
                        {log.type.toUpperCase()}
                      </Badge>
                    </div>
                    <div>{log.message}</div>
                    {log.details && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        <details>
                          <summary className="cursor-pointer">Details</summary>
                          <pre className="mt-1 bg-background p-2 rounded text-xs">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Cards */}
        {status && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Engine Status</CardTitle>
                  <CardDescription>Monitoring state</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${status.isMonitoring ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-lg font-semibold">
                      {status.isMonitoring ? "Running" : "Stopped"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Active Strategies</CardTitle>
                  <CardDescription>Currently monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{status.activeStrategies}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Last Update</CardTitle>
                  <CardDescription>Status refresh time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Active Strategies</h2>
              
              {status.strategies.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="text-muted-foreground">
                      <div className="text-4xl mb-2">📋</div>
                      <p className="text-lg font-medium mb-2">No active strategies</p>
                      <p className="text-sm">
                        Go to the <a href="/builder" className="text-blue-600 hover:underline">Strategy Builder</a> to create and deploy strategies.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {status.strategies.map((strategy) => (
                    <Card key={strategy.algoId}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">
                            Strategy #{strategy.algoId}
                          </CardTitle>
                          <Badge variant={strategy.active ? "default" : "secondary"}>
                            {strategy.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <CardDescription>
                          Real-time monitoring and execution
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Conditions:</h4>
                            <div className="space-y-1">
                              {strategy.conditions.map((condition, index) => (
                                <div key={index} className="text-xs bg-muted p-2 rounded">
                                  <code>
                                    {condition.type}: {condition.parameter} {condition.operator} {condition.value}
                                  </code>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Actions:</h4>
                            <div className="space-y-1">
                              {strategy.actions.map((action, index) => (
                                <div key={index} className="text-xs bg-muted p-2 rounded">
                                  <code>
                                    {action.type.toUpperCase()}: {action.amount} {action.asset}
                                  </code>
                                  {action.transactionXdr && (
                                    <div className="mt-1 text-xs text-green-600">
                                      📋 Real Transaction Prepared
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
