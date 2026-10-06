import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getProduct } from '@/lib/products'
import { getClientKey, hasOversizedBody, rateLimit, tooManyRequests, getConfiguredOrigin } from '@/lib/request-security'

export async function POST(request: Request) {
  const limit = rateLimit(getClientKey(request, 'checkout'), 10)
  if (!limit.allowed) return tooManyRequests(limit.retryAfter)
  if (hasOversizedBody(request, 8_192)) return NextResponse.json({ error: 'Request too large' }, { status: 413, headers: { 'Cache-Control': 'no-store' } })

  try {
    const formData = await request.formData()
    const product = getProduct(String(formData.get('product') ?? ''))
    const secretKey = process.env.STRIPE_SECRET_KEY

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    if (!secretKey) return NextResponse.json({ error: 'Payments are not configured yet.' }, { status: 503 })

    const stripe = new Stripe(secretKey)
    const origin = getConfiguredOrigin()
    if (!origin) return NextResponse.json({ error: 'Payments are not configured yet.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'usd', product_data: { name: product.name, description: product.description }, unit_amount: product.priceInCents }, quantity: 1 }],
      client_reference_id: `propauto_${crypto.randomUUID()}`,
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}` ,
      cancel_url: `${origin}/?payment=cancelled`,
      integration_identifier: `propauto_${Math.random().toString(36).slice(2, 10)}`,
      metadata: { product_id: product.id, source: 'propauto-web' },
    })

    return NextResponse.redirect(session.url ?? origin, 303)
  } catch {
    return NextResponse.json({ error: 'Unable to start checkout' }, { status: 502 })
  }
}
