/**
 * @fileoverview Subscription checkout parameters and the state kept from
 * Stripe subscription webhooks.
 */
import assert from 'node:assert/strict'
import { billingNotice, isActiveStatus, subscriptionCheckoutParams, subscriptionRecord } from '../../lib/billing'
import { PLANS, TRIAL_DAYS, getPlan } from '../../lib/plans'
import { paymentRecord } from '../../lib/payments'

const growth = getPlan('growth')

function event(type, object, extra = {}) {
  return { id: 'evt_1', object: 'event', type, livemode: false, created: 1_800_000_000, data: { object }, ...extra }
}

function subscription(overrides = {}) {
  return {
    id: 'sub_1',
    object: 'subscription',
    customer: 'cus_1',
    status: 'trialing',
    cancel_at_period_end: false,
    trial_end: 1_800_000_000,
    metadata: { plan: 'growth' },
    items: { data: [{ current_period_end: 1_802_592_000, price: { id: 'price_growth', metadata: { plan: 'growth' } } }] },
    ...overrides,
  }
}

test('plans have unique ids and lookup keys and positive prices', () => {
  assert.equal(new Set(PLANS.map((plan) => plan.id)).size, PLANS.length)
  assert.equal(new Set(PLANS.map((plan) => plan.lookupKey)).size, PLANS.length)
  for (const plan of PLANS) {
    assert.ok(Number.isInteger(plan.priceInCents) && plan.priceInCents > 0, plan.id)
    assert.equal(plan.features.en.length, plan.features.ar.length, plan.id)
  }
  assert.deepEqual(PLANS.map((plan) => plan.priceInCents), [4900, 14900, 39900])
  assert.equal(getPlan('enterprise'), undefined)
  assert.equal(getPlan(''), undefined)
})

test('subscription checkout collects a card, starts the trial and enables tax when configured', () => {
  const params = subscriptionCheckoutParams(growth, 'price_growth', 'https://propauto.example', true)
  assert.equal(params.mode, 'subscription')
  assert.deepEqual(params.line_items, [{ price: 'price_growth', quantity: 1 }])
  assert.equal(params.subscription_data.trial_period_days, TRIAL_DAYS)
  assert.deepEqual(params.subscription_data.metadata, { plan: 'growth' })
  assert.equal(params.payment_method_collection, 'always')
  assert.deepEqual(params.automatic_tax, { enabled: true })
  assert.equal(params.billing_address_collection, 'required')
  assert.deepEqual(params.tax_id_collection, { enabled: true })
  assert.equal(params.success_url, 'https://propauto.example/?billing=success&session_id={CHECKOUT_SESSION_ID}')
  assert.equal(params.cancel_url, 'https://propauto.example/?billing=cancelled#pricing')
  assert.match(params.client_reference_id, /^propauto_[0-9a-f-]{36}$/)
  assert.deepEqual(subscriptionCheckoutParams(growth, 'price_growth', 'https://propauto.example', false).automatic_tax, { enabled: false })
})

test('subscriptionRecord keeps the state of a subscription, with its period end from the item', () => {
  assert.deepEqual(subscriptionRecord(event('customer.subscription.created', subscription())), {
    id: 'sub_1',
    customerId: 'cus_1',
    plan: 'growth',
    priceId: 'price_growth',
    status: 'trialing',
    cancelAtPeriodEnd: false,
    trialEnd: new Date(1_800_000_000_000),
    currentPeriodEnd: new Date(1_802_592_000_000),
    livemode: false,
    eventCreated: 1_800_000_000,
  })
})

test('subscriptionRecord reads the period end from every item and keeps the soonest renewal', () => {
  const items = {
    data: [
      { current_period_end: 1_805_000_000, price: { id: 'price_growth', metadata: { plan: 'growth' } } },
      { current_period_end: 1_802_592_000, price: { id: 'price_addon', metadata: {} } },
      { price: { id: 'price_no_period', metadata: {} } },
    ],
  }
  const record = subscriptionRecord(event('customer.subscription.updated', subscription({ items })))
  assert.deepEqual(record.currentPeriodEnd, new Date(1_802_592_000_000))
  assert.equal(record.priceId, 'price_growth')
})

test('subscriptionRecord handles expanded customers, missing plan metadata, no trial and deletion', () => {
  const record = subscriptionRecord(event('customer.subscription.deleted', subscription({ customer: { id: 'cus_2' }, status: 'canceled', trial_end: null, metadata: {} })))
  assert.equal(record.customerId, 'cus_2')
  assert.equal(record.plan, 'growth')
  assert.equal(record.status, 'canceled')
  assert.equal(record.trialEnd, null)

  const bare = subscriptionRecord(event('customer.subscription.updated', subscription({ metadata: {}, items: { data: [] }, cancel_at_period_end: true })))
  assert.equal(bare.plan, null)
  assert.equal(bare.priceId, null)
  assert.equal(bare.currentPeriodEnd, null)
  assert.equal(bare.cancelAtPeriodEnd, true)
})

test('subscriptionRecord ignores other events', () => {
  assert.equal(subscriptionRecord(event('invoice.paid', {})), null)
  assert.equal(subscriptionRecord(event('customer.created', {})), null)
})

test('only trialing and active subscriptions grant access', () => {
  for (const status of ['trialing', 'active']) assert.equal(isActiveStatus(status), true, status)
  for (const status of ['past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'paused']) assert.equal(isActiveStatus(status), false, status)
})

test('billingNotice reports a completed subscription checkout once, not as a one-time payment', () => {
  const session = { id: 'cs_1', object: 'checkout.session', mode: 'subscription', payment_status: 'no_payment_required', amount_total: 0, currency: 'usd', metadata: { plan: 'growth' }, customer_details: { email: 'agency@example.com' } }
  assert.deepEqual(billingNotice(event('checkout.session.completed', session)), {
    eventId: 'evt_1', kind: 'subscription_started', plan: 'growth', customerEmail: 'agency@example.com', amountDue: 0, currency: 'usd', livemode: false,
  })
  assert.equal(paymentRecord(event('checkout.session.completed', { ...session, payment_status: 'paid' })), null)
  assert.equal(billingNotice(event('checkout.session.completed', { ...session, mode: 'payment' })), null)

  const bare = billingNotice(event('checkout.session.completed', { id: 'cs_2', mode: 'subscription' }))
  assert.equal(bare.plan, null)
  assert.equal(bare.customerEmail, null)
  assert.equal(bare.amountDue, null)
})

test('billingNotice reports a failed renewal with the plan from the subscription', () => {
  const invoice = { id: 'in_1', object: 'invoice', customer_email: 'agency@example.com', amount_due: 14900, currency: 'usd', parent: { subscription_details: { metadata: { plan: 'growth' } } } }
  assert.deepEqual(billingNotice(event('invoice.payment_failed', invoice)), {
    eventId: 'evt_1', kind: 'payment_failed', plan: 'growth', customerEmail: 'agency@example.com', amountDue: 14900, currency: 'usd', livemode: false,
  })
  const bare = billingNotice(event('invoice.payment_failed', { id: 'in_2' }))
  assert.equal(bare.plan, null)
  assert.equal(bare.customerEmail, null)
  assert.equal(billingNotice(event('invoice.paid', invoice)), null)
})
