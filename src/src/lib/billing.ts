/**
 * @fileoverview Subscription billing: the Checkout Session sent to Stripe and
 * the records kept from subscription webhooks. Free of Next.js and database
 * imports so it can be unit tested directly.
 */
import type Stripe from 'stripe'
import { TRIAL_DAYS, type Plan } from './plans'

/**
 * Builds a hosted Checkout Session for a monthly plan: card collected up
 * front, a free trial, the billing address and optional business tax ids for
 * invoices.
 *
 * @param plan - The plan being bought.
 * @param priceId - The Stripe price resolved from the plan's lookup key.
 * @param origin - Validated public origin for the return URLs.
 * @param automaticTax - Calculate tax with Stripe Tax. Stripe rejects the
 *   session until a head office address is set in its tax settings, so this
 *   is switched on by configuration once that is done.
 */
export function subscriptionCheckoutParams(plan: Plan, priceId: string, origin: string, automaticTax: boolean): Stripe.Checkout.SessionCreateParams {
  return {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: TRIAL_DAYS, metadata: { plan: plan.id } },
    payment_method_collection: 'always',
    automatic_tax: { enabled: automaticTax },
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
    allow_promotion_codes: true,
    client_reference_id: `propauto_${crypto.randomUUID()}`,
    success_url: `${origin}/?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?billing=cancelled#pricing`,
    metadata: { plan: plan.id, source: 'propauto-web' },
  }
}

/** The state of one subscription, as kept in propauto_subscriptions. */
export interface SubscriptionRecord {
  id: string
  customerId: string
  plan: string | null
  priceId: string | null
  status: Stripe.Subscription.Status
  cancelAtPeriodEnd: boolean
  trialEnd: Date | null
  currentPeriodEnd: Date | null
  livemode: boolean
  /** Event creation time (seconds); older events never overwrite newer state. */
  eventCreated: number
}

const SUBSCRIPTION_EVENTS = new Set(['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'])

const fromUnix = (seconds: number | null | undefined) => (typeof seconds === 'number' ? new Date(seconds * 1000) : null)

/**
 * Extracts the subscription state from a customer.subscription.* event, or
 * null for every other event. The billing period lives on the subscription
 * item in current API versions.
 */
export function subscriptionRecord(event: Stripe.Event): SubscriptionRecord | null {
  if (!SUBSCRIPTION_EVENTS.has(event.type)) return null
  const subscription = event.data.object as Stripe.Subscription
  const item = subscription.items?.data?.[0]
  return {
    id: subscription.id,
    customerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    plan: subscription.metadata?.plan ?? item?.price?.metadata?.plan ?? null,
    priceId: item?.price?.id ?? null,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: fromUnix(subscription.trial_end),
    currentPeriodEnd: fromUnix(item?.current_period_end),
    livemode: event.livemode,
    eventCreated: event.created,
  }
}

/** Statuses that grant access to the product. */
export function isActiveStatus(status: string) {
  return status === 'active' || status === 'trialing'
}

/** What the owner is told about a billing event. */
export interface BillingNotice {
  eventId: string
  kind: 'subscription_started' | 'payment_failed'
  plan: string | null
  customerEmail: string | null
  amountDue: number | null
  currency: string | null
  livemode: boolean
}

/**
 * Picks the billing events worth an owner notification: a completed
 * subscription checkout and a failed renewal payment. Null for anything else.
 */
export function billingNotice(event: Stripe.Event): BillingNotice | null {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.mode !== 'subscription') return null
    return {
      eventId: event.id,
      kind: 'subscription_started',
      plan: session.metadata?.plan ?? null,
      customerEmail: session.customer_details?.email ?? null,
      amountDue: session.amount_total ?? null,
      currency: session.currency ?? null,
      livemode: event.livemode,
    }
  }
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    return {
      eventId: event.id,
      kind: 'payment_failed',
      plan: invoice.parent?.subscription_details?.metadata?.plan ?? null,
      customerEmail: invoice.customer_email ?? null,
      amountDue: invoice.amount_due ?? null,
      currency: invoice.currency ?? null,
      livemode: event.livemode,
    }
  }
  return null
}
