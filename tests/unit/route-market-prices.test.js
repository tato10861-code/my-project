/**
 * @fileoverview Endpoint-level tests for GET /api/market-prices: configuration
 * is read per request, the upstream answer is size-capped and validated, and
 * each failure maps to its documented code. The upstream provider is mocked
 * at the global fetch boundary.
 */
import assert from 'node:assert/strict'

const mockCheckRateLimit = jest.fn()
jest.mock('@/lib/db/rate-limit', () => ({ checkRateLimit: (...args) => mockCheckRateLimit(...args) }))

import { GET } from '../../app/api/market-prices/route'

const body = async (response) => JSON.parse(await response.text())
const call = () => GET(new Request('https://propauto.example/api/market-prices'))
const upstream = (payload, init = {}) =>
  new Response(typeof payload === 'string' ? payload : JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })

const saved = { ...process.env }
const realFetch = global.fetch
beforeEach(() => {
  mockCheckRateLimit.mockReset().mockResolvedValue({ allowed: true, retryAfter: 1 })
  process.env.MARKET_DATA_API_URL = 'https://data.example/markets'
  process.env.MARKET_DATA_API_KEY = 'provider-key'
  global.fetch = jest.fn().mockResolvedValue(upstream({ markets: [] }))
})
afterEach(() => {
  global.fetch = realFetch
  process.env = { ...saved }
})

test('normalises provider markets and drops entries without a city or any price', async () => {
  global.fetch.mockResolvedValue(
    upstream({
      markets: [
        { city: ' Dubai ', property: '8.4', supercar: 6.8, currency: 'aed', signal: 'up' },
        { name: 'London', property: 3.2 },
        { city: 'Nowhere' },
        { property: 1 },
        'junk',
      ],
    }),
  )
  const response = await call()
  assert.equal(response.status, 200)
  assert.match(response.headers.get('cache-control'), /s-maxage=60/)
  const data = await body(response)
  assert.equal(data.source, 'verified-provider')
  assert.deepEqual(data.markets, [
    { city: 'Dubai', property: 8.4, supercar: 6.8, currency: 'AED', signal: 'up' },
    { city: 'London', property: 3.2, supercar: null, currency: 'USD', signal: 'steady' },
  ])
})

test('sends the provider key as a bearer token and an API key header', async () => {
  await call()
  const [url, init] = global.fetch.mock.calls[0]
  assert.equal(url, 'https://data.example/markets')
  assert.equal(init.headers.Authorization, 'Bearer provider-key')
  assert.equal(init.headers['X-API-Key'], 'provider-key')
})

test('reads the provider settings on every request, not once at import', async () => {
  delete process.env.MARKET_DATA_API_URL
  delete process.env.api
  const unconfigured = await call()
  assert.equal(unconfigured.status, 503)
  assert.equal((await body(unconfigured)).code, 'MARKET_DATA_NOT_CONFIGURED')

  process.env.MARKET_DATA_API_URL = 'https://data.example/other'
  assert.equal((await call()).status, 200)
  assert.equal(global.fetch.mock.calls[0][0], 'https://data.example/other')
})

test('answers 429 when the rate limit is exhausted, without calling the provider', async () => {
  mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfter: 12 })
  const response = await call()
  assert.equal(response.status, 429)
  assert.equal(global.fetch.mock.calls.length, 0)
})

test('answers 502 for a provider error status', async () => {
  global.fetch.mockResolvedValue(upstream('nope', { status: 500 }))
  const response = await call()
  assert.equal(response.status, 502)
  assert.equal((await body(response)).code, 'MARKET_DATA_PROVIDER_ERROR')
})

test('answers 502 for an unsupported, malformed or oversized provider answer', async () => {
  for (const payload of [{ unexpected: true }, '{not json', 'x'.repeat(300 * 1024)]) {
    global.fetch.mockResolvedValue(upstream(payload))
    const response = await call()
    assert.equal(response.status, 502)
    assert.equal((await body(response)).code, 'MARKET_DATA_INVALID_RESPONSE')
  }
})

test('stops reading an oversized answer that does not declare its length', async () => {
  const chunk = new TextEncoder().encode('x'.repeat(64 * 1024))
  let pulled = 0
  const stream = new ReadableStream({
    pull(controller) {
      pulled += 1
      controller.enqueue(chunk)
      if (pulled > 100) controller.close()
    },
  })
  global.fetch.mockResolvedValue(new Response(stream, { status: 200 }))
  const response = await call()
  assert.equal(response.status, 502)
  assert.ok(pulled < 20, `read ${pulled} chunks before giving up`)
})

test('answers 503 with a timeout or unavailable code when the fetch fails', async () => {
  global.fetch.mockRejectedValue(new DOMException('aborted', 'AbortError'))
  assert.equal((await body(await call())).code, 'MARKET_DATA_TIMEOUT')
  global.fetch.mockRejectedValue(new Error('ECONNREFUSED'))
  const response = await call()
  assert.equal(response.status, 503)
  assert.equal((await body(response)).code, 'MARKET_DATA_UNAVAILABLE')
})
