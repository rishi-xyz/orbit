"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { getAddress, isConnected, signTransaction } from "@stellar/freighter-api"
import { toast } from "sonner"

import "reactflow/dist/style.css"

import { AppShell } from "@/components/app-shell"
import {
  StrategyFlowBuilder,
  type StrategyFlowState,
} from "@/components/strategy-flow-builder"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { sha256Hex } from "@/lib/hash"

type FormValues = {
  name: string
  metadataUri: string
  paramsHash: string
}

export default function BuilderPage() {
  const [pubKey, setPubKey] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [flow, setFlow] = React.useState<StrategyFlowState>({ nodes: [], edges: [] })

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      metadataUri: "",
      paramsHash: "",
    },
  })

  async function connect() {
    try {
      const connected = await isConnected()
      if (!connected) {
        toast.error("Freighter not connected", {
          description: "Install/enable Freighter and connect a Testnet account.",
        })
        return
      }

      const res = await getAddress()
      const pk = (res as any)?.address as string | undefined
      if (!pk) {
        throw new Error("No address returned")
      }
      setPubKey(pk)
      toast.success("Wallet connected", { description: pk })
    } catch (e) {
      toast.error("Failed to connect wallet")
    }
  }

  async function onSubmit(values: FormValues) {
    if (!pubKey) {
      toast.error("Connect wallet first")
      return
    }

    if (!values.name || values.name.trim().length < 3) {
      form.setError("name", {
        type: "validate",
        message: "Name is too short",
      })
      return
    }

    setLoading(true)
    try {
      const graphJson = JSON.stringify({
        version: 1,
        nodes: flow.nodes,
        edges: flow.edges,
      })
      const hash = await sha256Hex(graphJson)
      const paramsHash = `sha256:${hash}`

      const prepareRes = await fetch("/api/soroban/create-algo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          owner: pubKey,
          name: values.name,
          metadataUri: values.metadataUri ?? "",
          paramsHash,
        }),
      })

      if (!prepareRes.ok) {
        const j = await prepareRes.json().catch(() => ({}))
        throw new Error(j?.error ?? "Failed to prepare transaction")
      }

      const { xdr } = (await prepareRes.json()) as { xdr: string }

      const signedRes = await signTransaction(xdr, {
        networkPassphrase: "Test SDF Network ; September 2015",
      })

      const signed =
        typeof signedRes === "string"
          ? signedRes
          : ((signedRes as any)?.signedTxXdr as string | undefined)

      if (!signed) {
        throw new Error("Freighter did not return a signed transaction")
      }

      const submitRes = await fetch("/api/soroban/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ xdr: signed }),
      })

      const submitJson = await submitRes.json()

      if (!submitRes.ok) {
        throw new Error(submitJson?.error ?? "Transaction submit failed")
      }

      toast.success("Strategy submitted", {
        description: submitJson?.hash ? `Tx: ${submitJson.hash}` : "Sent to network",
      })
      form.reset()
      setFlow({ nodes: [], edges: [] })
    } catch (e) {
      toast.error("Create strategy failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Strategy Builder
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Creator flow (Testnet). This stores strategy metadata on-chain via
              Algo Registry.
            </p>
          </div>
          <Button variant="secondary" onClick={connect}>
            {pubKey ? "Connected" : "Connect Freighter"}
          </Button>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Build strategy</CardTitle>
            <CardDescription>
              Drag nodes, connect them, then publish. The flow JSON is hashed to generate the
              on-chain params hash.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. XLM Momentum v1"
                  {...form.register("name")}
                />
                {form.formState.errors.name ? (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metadataUri">Metadata URI</Label>
                <Input
                  id="metadataUri"
                  placeholder="ipfs://... or https://..."
                  {...form.register("metadataUri")}
                />
              </div>

              <div className="grid gap-2">
                <Label>Canvas</Label>
                <StrategyFlowBuilder value={flow} onChange={setFlow} />
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Publish strategy"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
