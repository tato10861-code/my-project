import { NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { propautoOperatorLogs } from '@/lib/db/schema'
import { paymentRecord, STRIPE_WEBHOOK_MAX_BYTES, verifyStripeEvent, type PaymentRecord } from '@/lib/payments'
import { BodyTooLargeError, payloadTooLarge, readTextBody } from '@/lib/request-security'

const noStore = { 'Cache-Control': 'no-store' }

/**
 * Receives Stripe events. Each paid checkout is recorded once in the operator
 * log (Stripe retries deliveries, so the event id is checked first) and the
 * owner is emailed. Configure the endpoint in Stripe for
 * checkout.session.completed and checkout.session.async_payment_succeeded.
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

  let record: PaymentRecord | null
  try {
    record = paymentRecord(verifyStripeEvent(rawBody, request.headers.get('stripe-signature'), secret))
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400, headers: noStore })
  }
  if (!record) return NextResponse.json({ received: true }, { headers: noStore })

  try {
    const existing = await db
      .select({ id: propautoOperatorLogs.id })
      .from(propautoOperatorLogs)
      .where(and(eq(propautoOperatorLogs.botName, 'stripe'), sql`${propautoOperatorLogs.details}->>'eventId' = ${record.eventId}`))
      .limit(1)
    if (existing.length === 0) {
      await db.insert(propautoOperatorLogs).values({ botName: 'stripe', action: 'payment_received', status: 'completed', details: { ...record } })
      await notifyOwner(record)
    }
  } catch (error) {
    // A non-2xx answer makes Stripe retry, which is what we want on a storage outage.
    console.error('[stripe-webhook] recording failed:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Temporarily unavailable' }, { status: 503, headers: noStore })
  }

  return NextResponse.json({ received: true }, { headers: noStore })
}

async function notifyOwner(record: PaymentRecord) {
  const apiKey = process.env.RESEND_API_KEY_2 ?? process.env.RESEND_API_KEY
  if (!apiKey) return
  const amount = record.amountTotal === null ? 'unknown amount' : `${(record.amountTotal / 100).toFixed(2)} ${(record.currency ?? '').toUpperCase()}`
  const { error } = await new Resend(apiKey).emails.send(
    {
      from: process.env.RESEND_FROM_EMAIL ?? 'PropAuto Payments <onboarding@resend.dev>',
      to: ['propautoal@gmail.com'],
      subject: `PropAuto payment received: ${amount}`,
      text: `Product: ${record.productId ?? 'unknown'}\nAmount: ${amount}\nCustomer: ${record.customerEmail ?? 'not provided'}\nCheckout session: ${record.sessionId}\nMode: ${record.livemode ? 'live' : 'test'}`,
    },
    { idempotencyKey: `stripe-payment/${record.eventId}` },
  )
  if (error) console.error('[stripe-webhook] owner email failed:', error.message)
}
