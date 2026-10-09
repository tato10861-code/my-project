import { NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import type Stripe from 'stripe'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { propautoOperatorLogs, propautoSubscriptions } from '@/lib/db/schema'
import { billingNotice, subscriptionRecord, type BillingNotice, type SubscriptionRecord } from '@/lib/billing'
import { paymentRecord, STRIPE_WEBHOOK_MAX_BYTES, verifyStripeEvent, type PaymentRecord } from '@/lib/payments'
import { BodyTooLargeError, payloadTooLarge, readTextBody } from '@/lib/request-security'

const noStore = { 'Cache-Control': 'no-store' }

/**
 * Receives Stripe events. Configure the endpoint in Stripe for:
 * checkout.session.completed, checkout.session.async_payment_succeeded,
 * customer.subscription.created, customer.subscription.updated,
 * customer.subscription.deleted and invoice.payment_failed.
 *
 * - One-time purchases and billing notices are recorded once in the operator
 *   log (Stripe retries deliveries, so the event id is checked first) and the
 *   owner is emailed.
 * - Subscription events upsert propauto_subscriptions; an event older than the
 *   stored state never overwrites it, so out-of-order delivery is harmless.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503, headers: noStore })

  let rawBody: string
  try {
    rawBody = await readTextBody(request, STRIPE_WEBHOOK_MAX_BYTES)
  } catch (error) {
    if (error instanceof BodyTooLargeError) return payloadTooLarge()
    throw error
  }

  let event: Stripe.Event
  try {
    event = verifyStripeEvent(rawBody, request.headers.get('stripe-signature'), secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400, headers: noStore })
  }

  try {
    const subscription = subscriptionRecord(event)
    if (subscription) await saveSubscription(subscription)

    const payment = paymentRecord(event)
    if (payment && (await recordOnce('payment_received', payment.eventId, { ...payment }))) await notifyOwner(paymentEmail(payment))

    const notice = billingNotice(event)
    if (notice && (await recordOnce(notice.kind, notice.eventId, { ...notice }))) await notifyOwner(noticeEmail(notice))
  } catch (error) {
    // A non-2xx answer makes Stripe retry, which is what we want on a storage outage.
    console.error('[stripe-webhook] recording failed:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Temporarily unavailable' }, { status: 503, headers: noStore })
  }

  return NextResponse.json({ received: true }, { headers: noStore })
}

async function saveSubscription(record: SubscriptionRecord) {
  const { eventCreated, ...fields } = record
  const values = { ...fields, lastEventCreated: eventCreated, updatedAt: new Date() }
  await db
    .insert(propautoSubscriptions)
    .values(values)
    .onConflictDoUpdate({
      target: propautoSubscriptions.id,
      set: values,
      setWhere: sql`${propautoSubscriptions.lastEventCreated} <= ${eventCreated}`,
    })
}

/** Inserts an operator-log row for the event unless one exists; true when inserted. */
async function recordOnce(action: string, eventId: string, details: Record<string, unknown>) {
  const existing = await db
    .select({ id: propautoOperatorLogs.id })
    .from(propautoOperatorLogs)
    .where(and(eq(propautoOperatorLogs.botName, 'stripe'), sql`${propautoOperatorLogs.details}->>'eventId' = ${eventId}`))
    .limit(1)
  if (existing.length > 0) return false
  await db.insert(propautoOperatorLogs).values({ botName: 'stripe', action, status: 'completed', details })
  return true
}

interface OwnerEmail {
  idempotencyKey: string
  subject: string
  text: string
}

const formatAmount = (cents: number | null, currency: string | null) =>
  cents === null ? 'unknown amount' : `${(cents / 100).toFixed(2)} ${(currency ?? '').toUpperCase()}`

function paymentEmail(record: PaymentRecord): OwnerEmail {
  const amount = formatAmount(record.amountTotal, record.currency)
  return {
    idempotencyKey: `stripe-payment/${record.eventId}`,
    subject: `PropAuto payment received: ${amount}`,
    text: `Product: ${record.productId ?? 'unknown'}\nAmount: ${amount}\nCustomer: ${record.customerEmail ?? 'not provided'}\nCheckout session: ${record.sessionId}\nMode: ${record.livemode ? 'live' : 'test'}`,
  }
}

function noticeEmail(notice: BillingNotice): OwnerEmail {
  const plan = notice.plan ?? 'unknown plan'
  const subject = notice.kind === 'subscription_started' ? `PropAuto new subscription: ${plan}` : `PropAuto payment failed: ${plan}`
  return {
    idempotencyKey: `stripe-${notice.kind}/${notice.eventId}`,
    subject,
    text: `Plan: ${plan}\nAmount: ${formatAmount(notice.amountDue, notice.currency)}\nCustomer: ${notice.customerEmail ?? 'not provided'}\nMode: ${notice.livemode ? 'live' : 'test'}`,
  }
}

async function notifyOwner(email: OwnerEmail) {
  const apiKey = process.env.RESEND_API_KEY_2 ?? process.env.RESEND_API_KEY
  if (!apiKey) return
  const { error } = await new Resend(apiKey).emails.send(
    {
      from: process.env.RESEND_FROM_EMAIL ?? 'PropAuto Payments <onboarding@resend.dev>',
      to: ['propautoal@gmail.com'],
      subject: email.subject,
      text: email.text,
    },
    { idempotencyKey: email.idempotencyKey },
  )
  if (error) console.error('[stripe-webhook] owner email failed:', error.message)
}
