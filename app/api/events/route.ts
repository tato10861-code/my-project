import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { propautoEvents } from '@/lib/db/schema'
import { isAutomatedTraffic } from '@/lib/analytics'
import { EVENT_MAX_BODY_BYTES, eventSchema, type VisitorEvent } from '@/lib/events'
import {
  BodyTooLargeError,
  getClientKey,
  payloadTooLarge,
  readJsonBody,
  tooManyRequests,
  crossOriginForbidden,
  isSameOriginRequest,
} from '@/lib/request-security'
import { checkRateLimit } from '@/lib/db/rate-limit'
import { errorMessage, log } from '@/lib/log'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const noStore = { 'Cache-Control': 'no-store' }

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginForbidden()
  const limit = await checkRateLimit(getClientKey(request, 'events'), 30)
  if (!limit.allowed) return tooManyRequests(limit.retryAfter)

  let payload: VisitorEvent
  try {
    payload = eventSchema.parse(await readJsonBody(request, EVENT_MAX_BODY_BYTES))
  } catch (error) {
    if (error instanceof BodyTooLargeError) return payloadTooLarge()
    return NextResponse.json({ error: 'Invalid event details' }, { status: 400, headers: noStore })
  }

  // Crawlers and scripts are acknowledged but not counted, so they cannot inflate the audience figures.
  if (isAutomatedTraffic(request.headers.get('user-agent')))
    return NextResponse.json({ ok: true, counted: false }, { status: 202, headers: noStore })

  try {
    await db.insert(propautoEvents).values(payload)
    return NextResponse.json({ ok: true }, { status: 201, headers: noStore })
  } catch (error) {
    log('error', 'events.tracking_failed', { error: errorMessage(error) })
    return NextResponse.json(
      { error: 'Event tracking temporarily unavailable', retryable: true },
      { status: 503, headers: noStore },
    )
  }
}
