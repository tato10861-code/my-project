/**
 * @fileoverview Stripe webhook verification and payment extraction.
 */
import { test } from 'vitest'
import assert from 'node:assert/strict'
import Stripe from 'stripe'
import { paymentRecord, verifyStripeEvent } from '../../lib/payments.ts'

const secret = 'whsec_test_secret'

function event(type, session, extra = {}) {
  return { id: 'evt_1', object: 'event', type, livemode: false, data: { object: { id: 'cs_1', object: 'checkout.session', payment_status: 'paid', amount_total: 4900, currency: 'usd', metadata: { product_id: 'propauto-premium-access' }, customer_details: { email: 'buyer@example.com' }, ...session } }, ...extra }
}

function signed(payload, timestamp) {
  return Stripe.webhooks.generateTestHeaderString({ payload, secret, ...(timestamp ? { timestamp } : {}) })
}

test('verifyStripeEvent accepts a correctly signed payload', () => {
  const payload = JSON.stringify(event('checkout.session.completed', {}))
  assert.equal(verifyStripeEvent(payload, signed(payload), secret).id, 'evt_1')
})

test('verifyStripeEvent rejects a tampered body, a wrong secret, a missing header and a replayed old signature', () => {
  const payload = JSON.stringify(event('checkout.session.completed', {}))
  const header = signed(payload)
  assert.throws(() => verifyStripeEvent(payload.replace('4900', '1'), header, secret))
  assert.throws(() => verifyStripeEvent(payload, header, 'whsec_other'))
  assert.throws(() => verifyStripeEvent(payload, null, secret))
  const old = Math.floor(Date.now() / 1000) - 3600
  assert.throws(() => verifyStripeEvent(payload, signed(payload, old), secret))
})

test('paymentRecord keeps the fields of a paid checkout', () => {
  assert.deepEqual(paymentRecord(event('checkout.session.completed', {})), {
    eventId: 'evt_1', sessionId: 'cs_1', productId: 'propauto-premium-access', amountTotal: 4900, currency: 'usd', customerEmail: 'buyer@example.com', livemode: false,
  })
  assert.equal(paymentRecord(event('checkout.session.async_payment_succeeded', {})).sessionId, 'cs_1')
})

test('paymentRecord ignores unpaid sessions and unrelated events', () => {
  assert.equal(paymentRecord(event('checkout.session.completed', { payment_status: 'unpaid' })), null)
  assert.equal(paymentRecord(event('customer.created', {})), null)
})
