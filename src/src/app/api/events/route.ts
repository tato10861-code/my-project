import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { propautoEvents } from '@/lib/db/schema'
import { EVENT_MAX_BODY_BYTES, eventSchema, type VisitorEvent } from '@/lib/events'
import { BodyTooLargeError, getClientKey, payloadTooLarge, rateLimit, readJsonBody, tooManyRequests } from '@/lib/request-security'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const noStore = { 'Cache-Control': 'no-store' }

export async function POST(request: Request) {
  const limit = rateLimit(getClientKey(request, 'events'), 30)
  if (!limit.allowed) return tooManyRequests(limit.retryAfter)

  let payload: VisitorEvent
  try {
    payload = eventSchema.parse(await readJsonBody(request, EVENT_MAX_BODY_BYTES))
  } catch (error) {
    if (error instanceof BodyTooLargeError) return payloadTooLarge()
    return NextResponse.json({ error: 'Invalid event details' }, { status: 400, headers: noStore })
  }

  try {
    await db.insert(propautoEvents).values(payload)
    return NextResponse.json({ ok: true }, { status: 201, headers: noStore })
  } catch (error) {
    console.error('[events] tracking failed:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Event tracking temporarily unavailable', retryable: true }, { status: 503, headers: noStore })
  }
}
