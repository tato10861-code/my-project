import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getProduct } from '@/lib/products'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const product = getProduct(url.searchParams.get('product') ?? 'propauto-premium-access')
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  if (!secretKey) return NextResponse.json({ error: 'Payments are not configured yet.' }, { status: 503 })

  const stripe = new Stripe(secretKey)
  const origin = url.origin
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price_data: { currency: 'usd', product_data: { name: product.name, description: product.description }, unit_amount: product.priceInCents }, quantity: 1 }],
    client_reference_id: `propauto_${crypto.randomUUID()}`,
    success_url: `${origin}/?payment=success`,
    cancel_url: `${origin}/?payment=cancelled`,
    integration_identifier: `propauto_${Math.random().toString(36).slice(2, 10)}`,
    metadata: { product_id: product.id, source: 'propauto-web' },
  })

  return NextResponse.redirect(session.url ?? origin)
}
