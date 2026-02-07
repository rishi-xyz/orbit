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
import { StellarPriceChart } from "@/components/stellar-price-chart"
import { fetchStellarMarketSnapshot, fetchStellarPriceHistory } from "@/lib/coingecko"

function formatUsd(value: number | undefined) {
  if (typeof value !== "number") return "—"
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 4 : 8,
  })
}

function formatCompactUsd(value: number | undefined) {
  if (typeof value !== "number") return "—"
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  })
}

function formatPct(value: number | undefined) {
  if (typeof value !== "number") return "—"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

export default async function Home() {
  const data = await fetchStellarMarketSnapshot()
  const history = await fetchStellarPriceHistory({ days: 30 })

  const usd = data.market_data?.current_price?.usd
  const pct24h = data.market_data?.price_change_percentage_24h
  const high24h = data.market_data?.high_24h?.usd
  const low24h = data.market_data?.low_24h?.usd
  const mcap = data.market_data?.market_cap?.usd
  const vol = data.market_data?.total_volume?.usd

  const pctTone =
    typeof pct24h === "number" && pct24h !== 0
      ? pct24h > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400"
      : "text-muted-foreground"

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                Stellar
              </h1>
              <Badge variant="secondary" className="font-medium">
                XLM
              </Badge>
              {typeof data.market_cap_rank === "number" ? (
                <Badge variant="outline" className="font-medium">
                  Rank #{data.market_cap_rank}
                </Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Live market snapshot via CoinGecko
            </p>
          </div>

          <div className="text-right">
            <div className="text-muted-foreground text-xs">Price</div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight">
              {formatUsd(usd)}
            </div>
            <div className={`text-sm tabular-nums ${pctTone}`}>
              {formatPct(pct24h)} (24h)
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Market Cap
              </CardTitle>
              <CardDescription>USD</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold tabular-nums">
                {formatCompactUsd(mcap)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Volume</CardTitle>
              <CardDescription>24h</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold tabular-nums">
                {formatCompactUsd(vol)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Range</CardTitle>
              <CardDescription>24h high / low</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">High</div>
              <div className="text-base font-semibold tabular-nums">
                {formatUsd(high24h)}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">Low</div>
              <div className="text-base font-semibold tabular-nums">
                {formatUsd(low24h)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Price</CardTitle>
            <CardDescription>Last 30 days (USD)</CardDescription>
          </CardHeader>
          <CardContent>
            <StellarPriceChart data={history} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CardDescription>Last updated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {data.last_updated
                ? new Date(data.last_updated).toLocaleString()
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
