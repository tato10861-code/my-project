import { NextResponse } from 'next/server'
import { BodyTooLargeError, getClientKey, readTextBody, tooManyRequests } from '@/lib/request-security'
import { checkRateLimit } from '@/lib/db/rate-limit'

export const dynamic = 'force-dynamic'

/** Prices change slowly; let the CDN serve one answer per minute instead of calling the provider per visit. */
const CACHED = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }

/** A price list is small; a larger answer is a broken or hostile upstream, not data. */
const MAX_PROVIDER_BYTES = 256 * 1024

/** Read per request, so a changed setting needs no redeploy and tests can set it. */
function providerConfig() {
  return {
    url: process.env.MARKET_DATA_API_URL ?? process.env.api,
    key: process.env.MARKET_DATA_API_KEY ?? process.env.apiKey_2,
  }
}

function parseFiniteNumber(value: unknown) {
  const number =
    typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
  return Number.isFinite(number) ? number : null
}

function isMarketRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractMarkets(payload: unknown) {
  if (!isMarketRecord(payload)) return null
  const candidate = payload.markets ?? payload.data ?? payload.results
  if (!Array.isArray(candidate)) return null

  return candidate
    .filter(isMarketRecord)
    .map((market) => ({
      city:
        typeof market.city === 'string' && market.city.trim()
          ? market.city.trim()
          : typeof market.name === 'string' && market.name.trim()
            ? market.name.trim()
            : null,
      property: parseFiniteNumber(market.property),
      supercar: parseFiniteNumber(market.supercar),
      currency:
        typeof market.currency === 'string' && market.currency.trim() ? market.currency.trim().toUpperCase() : 'USD',
      signal: market.signal === 'up' || market.signal === 'down' ? market.signal : 'steady',
    }))
    .filter((market) => market.city !== null && (market.property !== null || market.supercar !== null))
}

export async function GET(request: Request) {
  const limit = await checkRateLimit(getClientKey(request, 'market-prices'), 30)
  if (!limit.allowed) return tooManyRequests(limit.retryAfter)
  const { url: providerUrl, key: providerKey } = providerConfig()
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

    const markets = extractMarkets(JSON.parse(await readTextBody(response, MAX_PROVIDER_BYTES)))
    if (!markets) {
      return NextResponse.json(
        { error: 'Market data provider returned an unsupported response.', code: 'MARKET_DATA_INVALID_RESPONSE' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json(
      { source: 'verified-provider', updatedAt: new Date().toISOString(), markets },
      { headers: CACHED },
    )
  } catch (error) {
    if (error instanceof BodyTooLargeError || error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Market data provider returned an unsupported response.', code: 'MARKET_DATA_INVALID_RESPONSE' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    const code =
      error instanceof DOMException && error.name === 'AbortError' ? 'MARKET_DATA_TIMEOUT' : 'MARKET_DATA_UNAVAILABLE'
    return NextResponse.json(
      { error: 'Market data is temporarily unavailable.', code },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  } finally {
    clearTimeout(timeout)
  }
}
