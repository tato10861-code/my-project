import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const providerUrl = process.env.MARKET_DATA_API_URL ?? process.env.api
const providerKey = process.env.MARKET_DATA_API_KEY ?? process.env.apiKey_2

function isMarketRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractMarkets(payload: unknown) {
  if (!isMarketRecord(payload)) return null
  const candidate = payload.markets ?? payload.data ?? payload.results
  if (!Array.isArray(candidate)) return null

  return candidate.filter(isMarketRecord).map((market) => ({
    city: typeof market.city === 'string' ? market.city : typeof market.name === 'string' ? market.name : 'Unknown',
    property: typeof market.property === 'number' ? market.property : null,
    supercar: typeof market.supercar === 'number' ? market.supercar : null,
    currency: typeof market.currency === 'string' ? market.currency : 'USD',
    signal: market.signal === 'up' || market.signal === 'down' ? market.signal : 'steady',
  }))
}

export async function GET() {
  if (!providerUrl) {
    return NextResponse.json(
      { error: 'Market data provider is not configured.', code: 'MARKET_DATA_NOT_CONFIGURED' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)

  try {
    const response = await fetch(providerUrl, {
      headers: {
        Accept: 'application/json',
        ...(providerKey ? { Authorization: `Bearer ${providerKey}`, 'X-API-Key': providerKey } : {}),
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Market data provider returned an error.', code: 'MARKET_DATA_PROVIDER_ERROR' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const markets = extractMarkets(await response.json())
    if (!markets) {
      return NextResponse.json(
        { error: 'Market data provider returned an unsupported response.', code: 'MARKET_DATA_INVALID_RESPONSE' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json(
      { source: 'verified-provider', updatedAt: new Date().toISOString(), markets },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    const code = error instanceof DOMException && error.name === 'AbortError' ? 'MARKET_DATA_TIMEOUT' : 'MARKET_DATA_UNAVAILABLE'
    return NextResponse.json({ error: 'Market data is temporarily unavailable.', code }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  } finally {
    clearTimeout(timeout)
  }
}
