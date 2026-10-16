import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { subscriptionCheckoutParams } from '@/lib/billing'
import { getPlan } from '@/lib/plans'
import { getProduct } from '@/lib/products'
import { BodyTooLargeError, getClientKey, payloadTooLarge, rateLimit, readFormBody, tooManyRequests, getConfiguredOrigin, crossOriginForbidden, isSameOriginRequest } from '@/lib/request-security'

const noStore = { 'Cache-Control': 'no-store' }

/** A checkout form carries one short field; anything larger is not ours. */
const CHECKOUT_MAX_BODY_BYTES = 8_192

/**
 * Starts a Stripe-hosted Checkout. A `plan` field starts a monthly
 * subscription with a free trial (Stripe Tax when STRIPE_AUTOMATIC_TAX is
 * "true"); a `product` field keeps the one-time premium access purchase.
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginForbidden()
  const limit = rateLimit(getClientKey(request, 'checkout'), 10)
  if (!limit.allowed) return tooManyRequests(limit.retryAfter)

  try {
    let formData: URLSearchParams
    try {
      formData = await readFormBody(request, CHECKOUT_MAX_BODY_BYTES)
    } catch (error) {
      if (error instanceof BodyTooLargeError) return payloadTooLarge()
      throw error
    }
    const plan = getPlan(formData.get('plan') ?? '')
    const product = plan ? undefined : getProduct(formData.get('product') ?? '')
    if (!plan && !product) return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: noStore })

    const secretKey = process.env.STRIPE_SECRET_KEY
    const origin = getConfiguredOrigin()
    if (!secretKey || !origin) return NextResponse.json({ error: 'Payments are not configured yet.' }, { status: 503, headers: noStore })
    const stripe = new Stripe(secretKey)

    let session: Stripe.Checkout.Session | undefined
    if (plan) {
      const prices = await stripe.prices.list({ lookup_keys: [plan.lookupKey], active: true, limit: 1 })
      const price = prices.data[0]
      if (!price) {
        console.error(`[checkout] no active Stripe price with lookup key ${plan.lookupKey}`)
        return NextResponse.json({ error: 'This plan is not available yet.' }, { status: 503, headers: noStore })
      }
      session = await stripe.checkout.sessions.create(subscriptionCheckoutParams(plan, price.id, origin, process.env.STRIPE_AUTOMATIC_TAX === 'true'))
    } else if (product) {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price_data: { currency: 'usd', product_data: { name: product.name, description: product.description }, unit_amount: product.priceInCents }, quantity: 1 }],
        client_reference_id: `propauto_${crypto.randomUUID()}`,
        success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/?payment=cancelled`,
        metadata: { product_id: product.id, source: 'propauto-web' },
      })
    }

    return NextResponse.redirect(session?.url ?? origin, 303)
  } catch (error) {
    console.error('[checkout] session creation failed:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Unable to start checkout' }, { status: 502, headers: noStore })
  }
}
