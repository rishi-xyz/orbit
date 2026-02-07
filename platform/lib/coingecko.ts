export type StellarMarketSnapshot = {
  id: string
  symbol: string
  name: string
  image?: {
    small?: string
    thumb?: string
    large?: string
  }
  market_data?: {
    current_price?: Record<string, number>
    price_change_percentage_24h?: number
    market_cap?: Record<string, number>
    total_volume?: Record<string, number>
    high_24h?: Record<string, number>
    low_24h?: Record<string, number>
  }
  market_cap_rank?: number
  last_updated?: string
}

export type StellarPricePoint = {
  t: number
  price: number
}

function getCoinGeckoApiKey() {
  return (
    process.env.COINGECKO_API_KEY ??
    process.env.NEXT_PUBLIC_COINGECKO_API_KEY ??
    process.env.CG_API_KEY ??
    ""
  )
}

export async function fetchStellarMarketSnapshot() {
  const apiKey = getCoinGeckoApiKey()

  const url = new URL("https://api.coingecko.com/api/v3/coins/stellar")
  url.searchParams.set("localization", "false")
  url.searchParams.set("tickers", "false")
  url.searchParams.set("market_data", "true")
  url.searchParams.set("community_data", "false")
  url.searchParams.set("developer_data", "false")
  url.searchParams.set("sparkline", "false")

  const headers: HeadersInit = {
    accept: "application/json",
  }

  if (apiKey) {
    headers["x-cg-pro-api-key"] = apiKey
    headers["x-cg-demo-api-key"] = apiKey
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    throw new Error(`CoinGecko error: ${res.status} ${res.statusText}`)
  }

  return (await res.json()) as StellarMarketSnapshot
}

export async function fetchStellarPriceHistory({
  days = 30,
}: {
  days?: number
} = {}) {
  const apiKey = getCoinGeckoApiKey()

  const url = new URL(
    "https://api.coingecko.com/api/v3/coins/stellar/market_chart"
  )
  url.searchParams.set("vs_currency", "usd")
  url.searchParams.set("days", `${days}`)
  url.searchParams.set("interval", "daily")

  const headers: HeadersInit = {
    accept: "application/json",
  }

  if (apiKey) {
    headers["x-cg-pro-api-key"] = apiKey
    headers["x-cg-demo-api-key"] = apiKey
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`CoinGecko error: ${res.status} ${res.statusText}`)
  }

  const json = (await res.json()) as { prices?: Array<[number, number]> }

  return (json.prices ?? []).map(([t, price]) => ({ t, price })) as StellarPricePoint[]
}
