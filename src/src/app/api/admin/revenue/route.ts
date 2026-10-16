import { NextResponse } from 'next/server'
import { requireOwner } from '@/lib/auth'
import { db } from '@/lib/db'
import { propautoSubscriptions } from '@/lib/db/schema'
import { summarizeRevenue } from '@/lib/revenue'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const noStore = { 'Cache-Control': 'no-store' }

/** Owner-only recurring-revenue summary built from the Stripe-synced subscriptions. */
export async function GET(request: Request) {
  if (!(await requireOwner(request.headers))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore })
  try {
    const rows = await db.select().from(propautoSubscriptions)
    return NextResponse.json({ ...summarizeRevenue(rows), source: 'neon' }, { headers: noStore })
  } catch (error) {
    console.error('[admin-revenue] query failed:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Revenue unavailable' }, { status: 503, headers: noStore })
  }
}
