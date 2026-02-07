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

import Link from "next/link"

import { StrategyInvestButton } from "@/components/strategy-invest-button"
import { fetchRegistryAlgos } from "@/lib/soroban"

export default async function StrategiesPage() {
  let algos: Awaited<ReturnType<typeof fetchRegistryAlgos>> = []

  try {
    algos = await fetchRegistryAlgos(50)
  } catch {
    algos = []
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Strategies</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              On-chain registry (Testnet). Investors can invest into strategy vaults.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/builder">Create strategy</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {algos.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardHeader>
                <CardTitle>No strategies found</CardTitle>
                <CardDescription>
                  Either the registry is empty or the RPC is unreachable.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/builder">Publish the first strategy</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            algos.map((s) => (
              <Card key={s.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{s.name}</CardTitle>
                    <CardDescription className="mt-1 break-all">
                      {s.metadataUri ? s.metadataUri : "No metadata URI"}
                    </CardDescription>
                  </div>
                  <Badge variant={s.active ? "outline" : "secondary"} className="shrink-0">
                    {s.active ? "Active" : "Paused"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="text-muted-foreground text-xs">
                  Owner: <span className="text-foreground break-all">{s.owner}</span>
                </div>
                <StrategyInvestButton algoId={s.id} />
              </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}
