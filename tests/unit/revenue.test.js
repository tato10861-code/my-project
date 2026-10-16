/**
 * @fileoverview Entitlement and recurring-revenue calculations.
 */
import assert from 'node:assert/strict'
import { entitlementFor, summarizeRevenue, PAST_DUE_GRACE_DAYS } from '../../lib/revenue'

const DAY = 86_400_000
const now = new Date('2026-10-16T12:00:00Z')
const sub = (overrides = {}) => ({
  id: 'sub_1',
  plan: 'starter',
  status: 'active',
  cancelAtPeriodEnd: false,
  trialEnd: null,
  currentPeriodEnd: new Date(now.getTime() + 10 * DAY),
  livemode: true,
  ...overrides,
})

test('active and trialing subscriptions grant access', () => {
  assert.deepEqual(entitlementFor(sub(), now).granted, true)
  const trial = entitlementFor(sub({ status: 'trialing', trialEnd: new Date(now.getTime() + 3 * DAY) }), now)
  assert.equal(trial.granted, true)
  assert.equal(trial.reason, 'trialing')
})

test('a cancellation scheduled for period end keeps access until then', () => {
  const entitlement = entitlementFor(sub({ cancelAtPeriodEnd: true }), now)
  assert.equal(entitlement.granted, true)
  assert.equal(entitlement.accessUntil.getTime(), now.getTime() + 10 * DAY)
})

test('past_due keeps access for the grace period only', () => {
  const periodEnd = new Date(now.getTime() - 2 * DAY)
  assert.equal(entitlementFor(sub({ status: 'past_due', currentPeriodEnd: periodEnd }), now).granted, true)
  const late = new Date(periodEnd.getTime() + (PAST_DUE_GRACE_DAYS + 1) * DAY)
  assert.equal(entitlementFor(sub({ status: 'past_due', currentPeriodEnd: periodEnd }), late).granted, false)
  assert.equal(entitlementFor(sub({ status: 'past_due', currentPeriodEnd: null }), now).granted, false)
})

test('ended, unpaid and incomplete subscriptions grant nothing', () => {
  for (const status of ['canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused']) {
    assert.equal(entitlementFor(sub({ status }), now).granted, false, status)
  }
  assert.equal(entitlementFor(sub({ status: 'unpaid' }), now).reason, 'unpaid')
})

test('MRR counts only live paying subscriptions and splits trial and at-risk revenue', () => {
  const summary = summarizeRevenue([
    sub({ id: 'a', plan: 'starter' }),
    sub({ id: 'b', plan: 'growth', cancelAtPeriodEnd: true }),
    sub({ id: 'c', plan: 'scale', status: 'trialing' }),
    sub({ id: 'd', plan: 'growth', status: 'past_due' }),
    sub({ id: 'e', plan: 'scale', status: 'canceled' }),
    sub({ id: 'f', plan: 'scale', livemode: false }),
  ])
  assert.equal(summary.mrrCents, 4_900 + 14_900)
  assert.equal(summary.trialMrrCents, 39_900)
  assert.equal(summary.atRiskMrrCents, 14_900)
  assert.deepEqual([summary.activeCount, summary.trialingCount, summary.pastDueCount, summary.cancelingCount], [2, 1, 1, 1])
  assert.deepEqual(summary.byPlan, { starter: 1, growth: 1 })
})

test('an unknown plan contributes no revenue instead of NaN', () => {
  const summary = summarizeRevenue([sub({ plan: 'legacy' }), sub({ id: 'x', plan: null })])
  assert.equal(summary.mrrCents, 0)
  assert.equal(summary.activeCount, 2)
})

test('no subscriptions yields an all-zero summary', () => {
  const summary = summarizeRevenue([])
  assert.equal(summary.mrrCents, 0)
  assert.deepEqual(summary.byPlan, {})
})
