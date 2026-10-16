/**
 * @fileoverview Endpoint-level tests for POST /api/checkout: origin, rate
 * limit, the byte cap on the form body, product and plan lookup, configuration
 * errors and the redirect to Stripe, with Stripe mocked at its boundary.
 */
import assert from 'node:assert/strict'

const mockPricesList = jest.fn()
const mockSessionsCreate = jest.fn()
const mockCheckRateLimit = jest.fn()
jest.mock('@/lib/db/rate-limit', () => ({ checkRateLimit: (...args) => mockCheckRateLimit(...args) }))
jest.mock('stripe', () =>
  jest.fn(() => ({
    prices: { list: (...args) => mockPricesList(...args) },
    checkout: { sessions: { create: (...args) => mockSessionsCreate(...args) } },
  })),
)

import { POST } from '../../app/api/checkout/route'
import { PLANS } from '../../lib/plans'
import { PRODUCTS } from '../../lib/products'

const ORIGIN = 'https://propauto.example'
const form = (fields, headers = {}) =>
  new Request(`${ORIGIN}/api/checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin: ORIGIN, ...headers },
    body: new URLSearchParams(fields).toString(),
  })

const saved = { ...process.env }
beforeEach(() => {
  mockPricesList.mockReset().mockResolvedValue({ data: [{ id: 'price_growth' }] })
  mockSessionsCreate.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.example/session' })
  mockCheckRateLimit.mockReset().mockResolvedValue({ allowed: true, retryAfter: 1 })
  process.env.STRIPE_SECRET_KEY = 'sk_test_x'
  process.env.NEXT_PUBLIC_SITE_URL = ORIGIN
  delete process.env.BETTER_AUTH_URL
  jest.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  jest.restoreAllMocks()
  process.env = { ...saved }
})

const planId = PLANS[0].id
const productId = PRODUCTS[0].id

test('redirects a plan purchase to Stripe Checkout with 303', async () => {
  const response = await POST(form({ plan: planId }))
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('location'), 'https://checkout.stripe.example/session')
  assert.equal(mockPricesList.mock.calls.length, 1)
  assert.equal(mockSessionsCreate.mock.calls[0][0].mode, 'subscription')
})

test('redirects a one-time product purchase to Stripe Checkout', async () => {
  const response = await POST(form({ product: productId }))
  assert.equal(response.status, 303)
  assert.equal(mockSessionsCreate.mock.calls[0][0].mode, 'payment')
  assert.equal(mockPricesList.mock.calls.length, 0)
})

test('rejects another origin and an exhausted rate limit', async () => {
  assert.equal((await POST(form({ plan: planId }, { origin: 'https://evil.example' }))).status, 403)
  mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfter: 5 })
  const limited = await POST(form({ plan: planId }))
  assert.equal(limited.status, 429)
  assert.equal(mockSessionsCreate.mock.calls.length, 0)
})

test('answers 413 when the form body is over the cap, declared or chunked', async () => {
  assert.equal((await POST(form({ plan: planId, pad: 'x'.repeat(9_000) }))).status, 413)

  const chunks = [new TextEncoder().encode('plan='), new TextEncoder().encode('x'.repeat(9_000))]
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk)
      controller.close()
    },
  })
  const chunked = new Request(`${ORIGIN}/api/checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin: ORIGIN },
    body: stream,
    duplex: 'half',
  })
  assert.equal((await POST(chunked)).status, 413)
  assert.equal(mockSessionsCreate.mock.calls.length, 0)
})

test('answers 404 for an unknown plan or product', async () => {
  assert.equal((await POST(form({ plan: 'nope' }))).status, 404)
  assert.equal((await POST(form({}))).status, 404)
})

test('answers 503 when payments are not configured', async () => {
  delete process.env.STRIPE_SECRET_KEY
  assert.equal((await POST(form({ plan: planId }))).status, 503)
  process.env.STRIPE_SECRET_KEY = 'sk_test_x'
  delete process.env.NEXT_PUBLIC_SITE_URL
  assert.equal((await POST(form({ plan: planId }))).status, 503)
})

test('answers 503 when the plan has no active Stripe price', async () => {
  mockPricesList.mockResolvedValue({ data: [] })
  assert.equal((await POST(form({ plan: planId }))).status, 503)
  assert.equal(mockSessionsCreate.mock.calls.length, 0)
})

test('answers 502 when Stripe fails', async () => {
  mockSessionsCreate.mockRejectedValue(new Error('stripe down'))
  assert.equal((await POST(form({ plan: planId }))).status, 502)
})
