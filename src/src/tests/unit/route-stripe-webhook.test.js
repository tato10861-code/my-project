/**
 * @fileoverview Endpoint-level tests for POST /api/webhooks/stripe, with real
 * Stripe signature verification and the database and email provider mocked at
 * their boundaries. The focus is the idempotency rules: a repeated delivery
 * must not notify the owner twice.
 */
import assert from 'node:assert/strict'
import Stripe from 'stripe'

const SECRET = 'whsec_test_secret'

const mockState = { existing: [], inserted: [{ id: 1 }], insertCalls: [], subscriptionCalls: [], insertError: null }
const mockSend = jest.fn()

jest.mock('@/lib/db', () => ({
  db: {
    select: () => {
      const node = {}
      for (const method of ['from', 'where']) node[method] = () => node
      node.limit = () => Promise.resolve(mockState.existing)
      return node
    },
    insert: () => ({
      values: (values) => ({
        // propauto_operator_logs: conflict-safe insert that reports whether this call inserted the row.
        onConflictDoNothing: () => ({
          returning: () => {
            mockState.insertCalls.push(values)
            return mockState.insertError ? Promise.reject(mockState.insertError) : Promise.resolve(mockState.inserted)
          },
        }),
        // propauto_subscriptions: upsert guarded against out-of-order events.
        onConflictDoUpdate: (options) => {
          mockState.subscriptionCalls.push({ values, options })
          return mockState.insertError ? Promise.reject(mockState.insertError) : Promise.resolve()
        },
      }),
    }),
  },
}))
jest.mock('resend', () => ({ Resend: jest.fn(() => ({ emails: { send: (...args) => mockSend(...args) } })) }))

import { POST } from '../../app/api/webhooks/stripe/route'

const checkoutCompleted = (overrides = {}) => ({
  id: 'evt_pay_1',
  object: 'event',
  type: 'checkout.session.completed',
  livemode: false,
  created: 1_800_000_000,
  data: { object: { id: 'cs_1', object: 'checkout.session', mode: 'payment', payment_status: 'paid', amount_total: 490000, currency: 'usd', metadata: { product_id: 'premium' }, customer_details: { email: 'buyer@example.com' }, ...overrides } },
})

const subscriptionUpdated = () => ({
  id: 'evt_sub_1',
  object: 'event',
  type: 'customer.subscription.updated',
  livemode: false,
  created: 1_800_000_100,
  data: { object: { id: 'sub_1', object: 'subscription', customer: 'cus_1', status: 'active', cancel_at_period_end: false, trial_end: null, metadata: { plan: 'growth' }, items: { data: [{ current_period_end: 1_802_592_000, price: { id: 'price_growth', metadata: {} } }] } } },
})

const signed = (event, { secret = SECRET, headers = {} } = {}) => {
  const payload = JSON.stringify(event)
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret })
  return new Request('https://propauto.example/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': signature, ...headers }, body: payload })
}

const saved = { ...process.env }
beforeEach(() => {
  Object.assign(mockState, { existing: [], inserted: [{ id: 1 }], insertCalls: [], subscriptionCalls: [], insertError: null })
  mockSend.mockReset().mockResolvedValue({ error: null })
  process.env.STRIPE_WEBHOOK_SECRET = SECRET
  process.env.RESEND_API_KEY = 're_test_key'
  delete process.env.RESEND_API_KEY_2
  jest.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  jest.restoreAllMocks()
  process.env = { ...saved }
})

test('answers 503 when the webhook secret is not configured', async () => {
  delete process.env.STRIPE_WEBHOOK_SECRET
  assert.equal((await POST(signed(checkoutCompleted()))).status, 503)
})

test('rejects a missing, forged or wrong-secret signature with 400', async () => {
  const noHeader = new Request('https://propauto.example/api/webhooks/stripe', { method: 'POST', body: JSON.stringify(checkoutCompleted()) })
  assert.equal((await POST(noHeader)).status, 400)
  assert.equal((await POST(signed(checkoutCompleted(), { secret: 'whsec_other' }))).status, 400)
  assert.equal(mockState.insertCalls.length, 0)
  assert.equal(mockSend.mock.calls.length, 0)
})

test('rejects a body over the size cap with 413 before verifying it', async () => {
  const huge = new Request('https://propauto.example/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': 't=1,v1=x' }, body: 'x'.repeat(300 * 1024) })
  assert.equal((await POST(huge)).status, 413)
})

test('records a paid checkout once and emails the owner', async () => {
  const response = await POST(signed(checkoutCompleted()))
  assert.equal(response.status, 200)
  assert.equal(mockState.insertCalls.length, 1)
  assert.equal(mockState.insertCalls[0].action, 'payment_received')
  assert.equal(mockSend.mock.calls.length, 1)
  assert.match(mockSend.mock.calls[0][0].subject, /payment received/i)
  assert.equal(mockSend.mock.calls[0][1].idempotencyKey, 'stripe-payment/evt_pay_1')
})

test('the owner email goes to the configured mailbox', async () => {
  process.env.NOTIFY_EMAIL = 'ops@buyer.example'
  await POST(signed(checkoutCompleted()))
  assert.deepEqual(mockSend.mock.calls[0][0].to, ['ops@buyer.example'])
})

test('a delivery already recorded is acknowledged without a second email', async () => {
  mockState.existing = [{ id: 7 }]
  const response = await POST(signed(checkoutCompleted()))
  assert.equal(response.status, 200)
  assert.equal(mockState.insertCalls.length, 0)
  assert.equal(mockSend.mock.calls.length, 0)
})

test('a concurrent duplicate that loses the insert race does not email either', async () => {
  // The lookup found nothing, but the unique index made this insert a no-op.
  mockState.inserted = []
  const response = await POST(signed(checkoutCompleted()))
  assert.equal(response.status, 200)
  assert.equal(mockState.insertCalls.length, 1)
  assert.equal(mockSend.mock.calls.length, 0)
})

test('upserts subscription state, guarded by the event timestamp', async () => {
  const response = await POST(signed(subscriptionUpdated()))
  assert.equal(response.status, 200)
  assert.equal(mockState.subscriptionCalls.length, 1)
  assert.equal(mockState.subscriptionCalls[0].values.id, 'sub_1')
  assert.equal(mockState.subscriptionCalls[0].values.status, 'active')
  assert.equal(mockState.subscriptionCalls[0].values.lastEventCreated, 1_800_000_100)
  assert.ok(mockState.subscriptionCalls[0].options.setWhere, 'older events must not overwrite newer state')
  assert.equal(mockSend.mock.calls.length, 0)
})

test('acknowledges events it does not handle without storing anything', async () => {
  const response = await POST(signed({ id: 'evt_other', object: 'event', type: 'customer.created', livemode: false, created: 1, data: { object: {} } }))
  assert.equal(response.status, 200)
  assert.equal(mockState.insertCalls.length, 0)
  assert.equal(mockState.subscriptionCalls.length, 0)
})

test('answers 503 on a storage failure so Stripe retries', async () => {
  mockState.insertError = new Error('connection refused')
  const response = await POST(signed(checkoutCompleted()))
  assert.equal(response.status, 503)
  assert.equal(mockSend.mock.calls.length, 0)
})

test('an owner-email failure does not fail the webhook', async () => {
  mockSend.mockResolvedValue({ error: { message: 'provider down' } })
  assert.equal((await POST(signed(checkoutCompleted()))).status, 200)
})
