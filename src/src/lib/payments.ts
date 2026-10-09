/**
 * @fileoverview Stripe webhook verification and the payment record kept for a
 * completed checkout. Free of Next.js and database imports so it can be unit
 * tested directly.
 */
import Stripe from 'stripe'

/** Stripe events are small; anything larger is not a genuine webhook. */
export const STRIPE_WEBHOOK_MAX_BYTES = 256 * 1024

/** The fields kept for a paid checkout. */
export interface PaymentRecord {
  eventId: string
  sessionId: string
  productId: string | null
  amountTotal: number | null
  currency: string | null
  customerEmail: string | null
  livemode: boolean
}

/**
 * Verifies the Stripe-Signature header against the raw body and returns the
 * event. Throws when the signature is missing, wrong, or older than Stripe's
 * default five-minute tolerance (replay protection).
 */
export function verifyStripeEvent(rawBody: string, signature: string | null, secret: string): Stripe.Event {
  if (!signature) throw new Error('Missing Stripe-Signature header')
  return Stripe.webhooks.constructEvent(rawBody, signature, secret)
}

/**
 * Extracts the payment record from a completed, paid checkout session.
 * Returns null for every other event (including sessions still awaiting an
 * asynchronous payment, and subscription checkouts), which the webhook acknowledges without storing.
 */
export function paymentRecord(event: Stripe.Event): PaymentRecord | null {
  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') return null
  const session = event.data.object as Stripe.Checkout.Session
  // Subscription checkouts are reported by lib/billing.ts instead.
  if (session.mode === 'subscription' || session.payment_status !== 'paid') return null
  return {
    eventId: event.id,
    sessionId: session.id,
    productId: session.metadata?.product_id ?? null,
    amountTotal: session.amount_total ?? null,
    currency: session.currency ?? null,
    customerEmail: session.customer_details?.email ?? null,
    livemode: event.livemode,
  }
}
