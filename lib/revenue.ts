/**
 * @fileoverview What a stored subscription entitles its customer to, and the
 * recurring-revenue figures derived from the subscriptions. Pure functions, free
 * of database and Next.js imports so they can be unit tested directly.
 */
import { getPlan } from './plans'

/** Days a customer keeps access after a renewal payment fails (Stripe retries meanwhile). */
export const PAST_DUE_GRACE_DAYS = 7

const DAY_MS = 86_400_000

/** The subscription columns the calculations need. */
export interface StoredSubscription {
  id: string
  plan: string | null
  status: string
  cancelAtPeriodEnd: boolean
  trialEnd: Date | null
  currentPeriodEnd: Date | null
  livemode: boolean
}

export type EntitlementReason = 'active' | 'trialing' | 'grace_period' | 'ended' | 'unpaid' | 'incomplete'

export interface Entitlement {
  /** True when the customer may use the product right now. */
  granted: boolean
  reason: EntitlementReason
  /** When access ends if nothing changes: the period end, or the end of the grace period. */
  accessUntil: Date | null
}

/**
 * Decides whether a subscription grants access at `now`.
 *
 * - active / trialing: granted. A cancellation scheduled for period end keeps
 *   the access until then, which Stripe reports as status "active".
 * - past_due: granted for {@link PAST_DUE_GRACE_DAYS} days after the period
 *   that failed to renew, so a card that is retried successfully loses nothing.
 * - everything else (canceled, unpaid, incomplete, expired, paused): not granted.
 */
export function entitlementFor(subscription: StoredSubscription, now: Date = new Date()): Entitlement {
  const { status, currentPeriodEnd } = subscription
  if (status === 'active') return { granted: true, reason: 'active', accessUntil: currentPeriodEnd }
  if (status === 'trialing')
    return { granted: true, reason: 'trialing', accessUntil: subscription.trialEnd ?? currentPeriodEnd }
  if (status === 'past_due') {
    const graceEnd = currentPeriodEnd ? new Date(currentPeriodEnd.getTime() + PAST_DUE_GRACE_DAYS * DAY_MS) : null
    return { granted: graceEnd !== null && now < graceEnd, reason: 'grace_period', accessUntil: graceEnd }
  }
  if (status === 'unpaid') return { granted: false, reason: 'unpaid', accessUntil: null }
  if (status === 'incomplete' || status === 'incomplete_expired')
    return { granted: false, reason: 'incomplete', accessUntil: null }
  return { granted: false, reason: 'ended', accessUntil: null }
}

/** Recurring-revenue figures for the owner dashboard. Amounts are integer cents. */
export interface RevenueSummary {
  /** Monthly recurring revenue from paying (active) subscriptions. */
  mrrCents: number
  /** Monthly revenue that starts once the running trials convert. */
  trialMrrCents: number
  /** Monthly revenue at risk from renewals that failed to charge. */
  atRiskMrrCents: number
  activeCount: number
  trialingCount: number
  pastDueCount: number
  /** Subscriptions that will end at their period end. */
  cancelingCount: number
  /** Paying customers per plan id. */
  byPlan: Record<string, number>
}

const monthlyCents = (planId: string | null) => (planId ? (getPlan(planId)?.priceInCents ?? 0) : 0)

/**
 * Sums recurring revenue across subscriptions. Test-mode subscriptions never
 * count, so sandbox checkouts cannot inflate the figures shown to an investor.
 */
export function summarizeRevenue(subscriptions: readonly StoredSubscription[]): RevenueSummary {
  const summary: RevenueSummary = {
    mrrCents: 0,
    trialMrrCents: 0,
    atRiskMrrCents: 0,
    activeCount: 0,
    trialingCount: 0,
    pastDueCount: 0,
    cancelingCount: 0,
    byPlan: {},
  }
  for (const subscription of subscriptions) {
    if (!subscription.livemode) continue
    const cents = monthlyCents(subscription.plan)
    if (subscription.status === 'active') {
      summary.activeCount += 1
      summary.mrrCents += cents
      if (subscription.plan) summary.byPlan[subscription.plan] = (summary.byPlan[subscription.plan] ?? 0) + 1
      if (subscription.cancelAtPeriodEnd) summary.cancelingCount += 1
    } else if (subscription.status === 'trialing') {
      summary.trialingCount += 1
      summary.trialMrrCents += cents
      if (subscription.cancelAtPeriodEnd) summary.cancelingCount += 1
    } else if (subscription.status === 'past_due') {
      summary.pastDueCount += 1
      summary.atRiskMrrCents += cents
    }
  }
  return summary
}
